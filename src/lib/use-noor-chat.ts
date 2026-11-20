import { useCallback, useEffect, useRef, useState } from "react";
import type { NoorAction } from "@/data/noor";
import { useAuth } from "./auth";
import {
  chatKey,
  createRemoteChatSaver,
  deleteRemoteSaved,
  fetchRemoteChat,
  fetchRemoteSaved,
  insertRemoteSaved,
  isLocalSavedId,
  loadLocalChat,
  loadLocalSaved,
  makeChatTitle,
  MAX_SAVED_CHATS,
  MAX_STORED_MESSAGES,
  newLocalSavedId,
  pickNewer,
  sanitizeChat,
  saveLocalChat,
  saveLocalSaved,
  savedKey,
  type SavedChat,
  type StoredMessage,
} from "./noor-chat";
import { getSupabase } from "./supabase";

/** A stored message plus the transient navigation buttons (buttons are not persisted). */
export interface ChatMessage extends StoredMessage {
  actions?: NoorAction[];
}

/**
 * Noor's conversation, kept across page reloads and navigation. Guests (and every user as a backup)
 * use localStorage; signed-in users also sync to their own `noor_conversations` row. Each account
 * has its own local key, and a user's local copy is removed when they sign out.
 */
export function useNoorChat() {
  const { user, status } = useAuth();
  const userId = user?.id ?? null;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  /** Which account the in-memory conversation belongs to; undefined = not loaded yet. */
  const loadedFor = useRef<string | null | undefined>(undefined);
  const saverRef = useRef<ReturnType<typeof createRemoteChatSaver> | null>(null);
  const prevUser = useRef<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;

    // The previous account signed out on this device: don't leave its chat behind.
    if (prevUser.current && prevUser.current !== userId) {
      try {
        window.localStorage.removeItem(chatKey(prevUser.current));
      } catch {
        /* storage blocked */
      }
    }
    prevUser.current = userId;

    const local = loadLocalChat(userId);
    const base: ChatMessage[] = local?.messages ?? [];
    messagesRef.current = base;
    setMessages(base);
    loadedFor.current = userId;

    const client = userId ? getSupabase() : null;
    if (userId && client) {
      const saver = createRemoteChatSaver(client, userId);
      saverRef.current = saver;
      void fetchRemoteChat(client, userId).then((remote) => {
        // Ignore the account copy if the student already typed while it was loading.
        if (cancelled || messagesRef.current !== base) return;
        const best = pickNewer(local, remote);
        if (best && best !== local) {
          messagesRef.current = best.messages;
          setMessages(best.messages);
          saveLocalChat(userId, best);
        } else if (local && local.messages.length) {
          saver.schedule(local);
        }
      });
    }

    return () => {
      cancelled = true;
      saverRef.current?.dispose();
      saverRef.current = null;
    };
  }, [status, userId]);

  const update = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    const next = updater(messagesRef.current).slice(-MAX_STORED_MESSAGES);
    messagesRef.current = next;
    setMessages(next);
    if (loadedFor.current === undefined) return;
    const snapshot = {
      updatedAt: Date.now(),
      messages: next.map((m) => ({ role: m.role, text: m.text })),
    };
    saveLocalChat(loadedFor.current, snapshot);
    saverRef.current?.schedule(snapshot);
  }, []);

  const append = useCallback(
    (message: ChatMessage) => update((prev) => [...prev, message]),
    [update],
  );
  const clear = useCallback(() => update(() => []), [update]);
  /** Swaps the current conversation for another one (e.g. a saved chat). */
  const replace = useCallback(
    (next: StoredMessage[]) => update(() => sanitizeChat(next)),
    [update],
  );

  return { messages, messagesRef, append, clear, replace, scope: userId };
}

export type SaveResult = "ok" | "empty" | "limit" | "error";

/**
 * The saved-chats list. Saving is always a manual action; nothing here runs on its own except
 * `refresh()` (called when the list is opened). Signed-in users use their `noor_saved_chats` rows;
 * guests (and an unreachable account table) use localStorage.
 */
export function useSavedChats() {
  const { user, status } = useAuth();
  const userId = user?.id ?? null;
  const [saved, setSaved] = useState<SavedChat[]>([]);
  const [loading, setLoading] = useState(false);
  /** The account the list belongs to; async results for another account are dropped. */
  const scope = useRef<string | null | undefined>(undefined);
  const prevUser = useRef<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (prevUser.current && prevUser.current !== userId) {
      try {
        window.localStorage.removeItem(savedKey(prevUser.current));
      } catch {
        /* storage blocked */
      }
    }
    prevUser.current = userId;
    scope.current = userId;
    setSaved([]);
    setLoading(false);
  }, [status, userId]);

  const refresh = useCallback(async () => {
    if (status === "loading") return;
    const mine = userId;
    setLoading(true);
    const client = mine ? getSupabase() : null;
    const remote = client && mine ? await fetchRemoteSaved(client, mine) : null;
    if (scope.current !== mine) return;
    const merged = [...(remote ?? []), ...loadLocalSaved(mine)]
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, MAX_SAVED_CHATS);
    setSaved(merged);
    setLoading(false);
  }, [status, userId]);

  const save = useCallback(
    async (messages: StoredMessage[], fallbackTitle: string): Promise<SaveResult> => {
      const clean = sanitizeChat(messages);
      if (clean.length === 0) return "empty";
      const mine = userId;
      const title = makeChatTitle(clean, fallbackTitle);

      const client = mine ? getSupabase() : null;
      if (client && mine) {
        const row = await insertRemoteSaved(client, mine, title, clean);
        if (scope.current !== mine) return "error";
        if (row === "limit") return "limit";
        if (row) {
          setSaved((prev) => [row, ...prev].slice(0, MAX_SAVED_CHATS));
          return "ok";
        }
      }
      // Guest, or the account table is not reachable: keep it on this device.
      const local = loadLocalSaved(mine);
      if (local.length >= MAX_SAVED_CHATS) return "limit";
      const entry: SavedChat = {
        id: newLocalSavedId(),
        title,
        savedAt: Date.now(),
        messages: clean,
      };
      if (!saveLocalSaved(mine, [entry, ...local])) return "error";
      if (scope.current !== mine) return "error";
      setSaved((prev) => [entry, ...prev].slice(0, MAX_SAVED_CHATS));
      return "ok";
    },
    [userId],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const mine = userId;
      let ok: boolean;
      if (isLocalSavedId(id)) {
        ok = saveLocalSaved(
          mine,
          loadLocalSaved(mine).filter((c) => c.id !== id),
        );
      } else {
        const client = mine ? getSupabase() : null;
        ok = client && mine ? await deleteRemoteSaved(client, mine, id) : false;
      }
      if (ok && scope.current === mine) setSaved((prev) => prev.filter((c) => c.id !== id));
      return ok;
    },
    [userId],
  );

  return { saved, loading, refresh, save, remove };
}
