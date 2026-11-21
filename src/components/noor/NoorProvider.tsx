import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { StudioFocus, StudioKind } from "@/data/lessons/noorStudio";
import type { SupportNoorContext } from "@/data/lessons/supportNoor";
import type { SimulationDef } from "@/data/simulations";
import type { TutorContext } from "@/data/tutor";

/** What a lesson page tells Noor about the live simulation. */
export interface NoorLesson {
  lessonId: string;
  sim: SimulationDef;
  ctx: TutorContext;
  /** True in teacher board mode: Noor hides itself. */
  hidden: boolean;
}

/** What the interactive "live board" lesson tells Noor: the block on screen and the student's work. */
export interface NoorSupport {
  ctx: SupportNoorContext;
  hidden: boolean;
}

/** A question another part of the page wants Noor to answer (e.g. "review my explanation"). */
export interface NoorRequest {
  id: number;
  text: string;
  /** The pack the question is about (e.g. «عدّل مع نور» on a custom map). */
  studio?: StudioFocus;
  /** Read the text as a possible Noor Studio command («اعملّي خريطة…»). Off for ordinary prompts. */
  detect?: boolean;
}

/** Asks the live board to open a Noor Studio creation in the Mind Map / Flashcards Lab. */
export interface StudioOpenRequest {
  id: number;
  kind: StudioKind;
  packId: string | null;
}

interface Control {
  setOpen: (open: boolean) => void;
  setLesson: (lesson: NoorLesson | null) => void;
  setSupport: (support: NoorSupport | null) => void;
  /** Opens Noor and sends `text` as the student's question. */
  ask: (text: string, opts?: { studio?: StudioFocus; detect?: boolean }) => void;
  /** Asks the board to open a Studio pack (kept until the board consumes it). */
  openStudio: (kind: StudioKind, packId: string | null) => void;
  consumeStudioOpen: (id: number) => void;
  /** Remembers which pack «عدّل دي» refers to. */
  setStudioFocus: (focus: StudioFocus | null) => void;
}

// Separate contexts on purpose: a lesson page updates `lesson` on every slider move, and must be able
// to do so without re-rendering itself (it only reads the stable control object and `open`).
const ControlContext = createContext<Control>({
  setOpen: () => {},
  setLesson: () => {},
  setSupport: () => {},
  ask: () => {},
  openStudio: () => {},
  consumeStudioOpen: () => {},
  setStudioFocus: () => {},
});
const OpenContext = createContext(false);
const LessonContext = createContext<NoorLesson | null>(null);
const SupportContext = createContext<NoorSupport | null>(null);
const RequestContext = createContext<NoorRequest | null>(null);
const StudioOpenContext = createContext<StudioOpenRequest | null>(null);
const StudioFocusContext = createContext<StudioFocus | null>(null);

export function NoorProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [lesson, setLesson] = useState<NoorLesson | null>(null);
  const [support, setSupport] = useState<NoorSupport | null>(null);
  const [request, setRequest] = useState<NoorRequest | null>(null);
  const [studioOpen, setStudioOpen] = useState<StudioOpenRequest | null>(null);
  const [studioFocus, setStudioFocus] = useState<StudioFocus | null>(null);
  const control = useMemo<Control>(
    () => ({
      setOpen,
      setLesson,
      setSupport,
      ask: (text, opts) => {
        setOpen(true);
        setRequest((prev) => ({
          id: (prev?.id ?? 0) + 1,
          text,
          ...(opts?.studio ? { studio: opts.studio } : {}),
          ...(opts?.detect ? { detect: true } : {}),
        }));
      },
      openStudio: (kind, packId) =>
        setStudioOpen((prev) => ({ id: (prev?.id ?? 0) + 1, kind, packId })),
      consumeStudioOpen: (id) => setStudioOpen((prev) => (prev?.id === id ? null : prev)),
      setStudioFocus: (focus) =>
        setStudioFocus((prev) =>
          prev?.kind === focus?.kind && prev?.packId === focus?.packId ? prev : focus,
        ),
    }),
    [],
  );
  return (
    <ControlContext.Provider value={control}>
      <OpenContext.Provider value={open}>
        <LessonContext.Provider value={lesson}>
          <SupportContext.Provider value={support}>
            <RequestContext.Provider value={request}>
              <StudioOpenContext.Provider value={studioOpen}>
                <StudioFocusContext.Provider value={studioFocus}>
                  {children}
                </StudioFocusContext.Provider>
              </StudioOpenContext.Provider>
            </RequestContext.Provider>
          </SupportContext.Provider>
        </LessonContext.Provider>
      </OpenContext.Provider>
    </ControlContext.Provider>
  );
}

/** Stable setters. Safe to call from effects without causing re-renders of the caller. */
export const useNoorControl = () => useContext(ControlContext);
export const useNoorOpen = () => useContext(OpenContext);
export const useNoorLesson = () => useContext(LessonContext);
export const useNoorSupport = () => useContext(SupportContext);
export const useNoorRequest = () => useContext(RequestContext);
export const useStudioOpen = () => useContext(StudioOpenContext);
export const useStudioFocus = () => useContext(StudioFocusContext);
