import { useCallback, useEffect, useRef, useState } from "react";
import type { NoorAction } from "@/data/noor";
import { useAuth } from "./auth";
import {
  chatKey,
  createRemoteChatSaver,
  fetchRemoteChat,
  loadLocalChat,
  MAX_STORED_MESSAGES,
  pickNewer,
  saveLocalChat,
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

  return { messages, messagesRef, append, clear, scope: userId };
}
