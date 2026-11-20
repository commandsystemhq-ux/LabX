import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
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

interface Control {
  setOpen: (open: boolean) => void;
  setLesson: (lesson: NoorLesson | null) => void;
}

// Three contexts on purpose: a lesson page updates `lesson` on every slider move, and must be able
// to do so without re-rendering itself (it only reads the stable control object and `open`).
const ControlContext = createContext<Control>({ setOpen: () => {}, setLesson: () => {} });
const OpenContext = createContext(false);
const LessonContext = createContext<NoorLesson | null>(null);

export function NoorProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [lesson, setLesson] = useState<NoorLesson | null>(null);
  const control = useMemo<Control>(() => ({ setOpen, setLesson }), []);
  return (
    <ControlContext.Provider value={control}>
      <OpenContext.Provider value={open}>
        <LessonContext.Provider value={lesson}>{children}</LessonContext.Provider>
      </OpenContext.Provider>
    </ControlContext.Provider>
  );
}

/** Stable setters. Safe to call from effects without causing re-renders of the caller. */
export const useNoorControl = () => useContext(ControlContext);
export const useNoorOpen = () => useContext(OpenContext);
export const useNoorLesson = () => useContext(LessonContext);
