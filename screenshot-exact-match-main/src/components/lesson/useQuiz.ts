import { useCallback, useReducer } from "react";

export interface QuizState {
  index: number;
  selected: number | null;
  score: number;
  /** A wrong pick was made on this question; a later correct pick earns no point. */
  missed: boolean;
  done: boolean;
}

export type QuizAction =
  | { type: "choose"; option: number; correct: number }
  | { type: "next"; total: number }
  | { type: "clear" }
  | { type: "restart" };

export const initialQuiz: QuizState = {
  index: 0,
  selected: null,
  score: 0,
  missed: false,
  done: false,
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "choose": {
      if (state.selected !== null || state.done) return state;
      const right = action.option === action.correct;
      return {
        ...state,
        selected: action.option,
        score: right && !state.missed ? state.score + 1 : state.score,
        missed: state.missed || !right,
      };
    }
    case "next":
      if (state.index + 1 >= action.total) return { ...state, done: true };
      return { ...state, index: state.index + 1, selected: null, missed: false };
    case "clear":
      return state.selected === null ? state : { ...state, selected: null };
    case "restart":
      return initialQuiz;
  }
}

/** Quiz state lives in the workspace so it survives leaving step 4 (e.g. to see a mistake). */
export function useQuiz() {
  const [state, dispatch] = useReducer(quizReducer, initialQuiz);
  return {
    state,
    choose: useCallback(
      (option: number, correct: number) => dispatch({ type: "choose", option, correct }),
      [],
    ),
    next: useCallback((total: number) => dispatch({ type: "next", total }), []),
    clear: useCallback(() => dispatch({ type: "clear" }), []),
    restart: useCallback(() => dispatch({ type: "restart" }), []),
  };
}

export type QuizApi = ReturnType<typeof useQuiz>;
