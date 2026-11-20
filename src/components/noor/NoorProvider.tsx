import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
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
}

interface Control {
  setOpen: (open: boolean) => void;
  setLesson: (lesson: NoorLesson | null) => void;
  setSupport: (support: NoorSupport | null) => void;
  /** Opens Noor and sends `text` as the student's question. */
  ask: (text: string) => void;
}

// Separate contexts on purpose: a lesson page updates `lesson` on every slider move, and must be able
// to do so without re-rendering itself (it only reads the stable control object and `open`).
const ControlContext = createContext<Control>({
  setOpen: () => {},
  setLesson: () => {},
  setSupport: () => {},
  ask: () => {},
});
const OpenContext = createContext(false);
const LessonContext = createContext<NoorLesson | null>(null);
const SupportContext = createContext<NoorSupport | null>(null);
const RequestContext = createContext<NoorRequest | null>(null);

export function NoorProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [lesson, setLesson] = useState<NoorLesson | null>(null);
  const [support, setSupport] = useState<NoorSupport | null>(null);
  const [request, setRequest] = useState<NoorRequest | null>(null);
  const control = useMemo<Control>(
    () => ({
      setOpen,
      setLesson,
      setSupport,
      ask: (text) => {
        setOpen(true);
        setRequest((prev) => ({ id: (prev?.id ?? 0) + 1, text }));
      },
    }),
    [],
  );
  return (
    <ControlContext.Provider value={control}>
      <OpenContext.Provider value={open}>
        <LessonContext.Provider value={lesson}>
          <SupportContext.Provider value={support}>
            <RequestContext.Provider value={request}>{children}</RequestContext.Provider>
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
