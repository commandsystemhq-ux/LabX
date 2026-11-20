# LabX — Architecture & Engineering Rules

Interactive science learning platform (Biology, Physics, Chemistry), Web-first and lightweight.
Stack: React 19 · TanStack Start/Router · Tailwind v4 · Recharts · Lucide. Three.js is planned (see `SimulationStage`).

## 1. Engineering rules (binding for every change)

Before writing or changing code, think step by step:

1. **Requirements** — what exactly is asked, and how does it fit the current structure without needless complexity?
2. **Edge cases** — boundary and extreme values, poor connectivity, different screen sizes and devices.
3. **Security risks** — leaked API keys, XSS, data permissions, untrusted input — and how each is prevented.
4. **Scalability & performance** — light, clean, maintainable, able to handle high user load and large data flow.

After implementing, self-review:

- Bugs, logic errors, memory/event leaks?
- Clear wins in performance, readability or UX?
- Were existing features preserved (nothing broken)?

Fix every problem found. Only deliver code after verifying it is correct and coherent, with a short explanation of the changes and assumptions.

## 2. Domain model

```
Grade (g10 | g11 | g12)
 └─ Subject (biology | physics | chemistry)
     └─ Unit
         └─ Lesson ──▶ Simulation (diffusion | ohm | reaction-rate)
```

- `src/data/mockCurriculum.ts` — curriculum tree + lookup helpers. Components depend only on its types, so it can be replaced by an API.
- `src/data/simulations.ts` — models (pure functions), variables, graph specs, story/explain/quiz content.
- `src/data/simExtras.ts` — per-simulation learning extras: faults, hazards (real-world error mode), guided-discovery steps, calculation steps, subject layers.
- `src/data/tutor.ts` — context-aware tutor: intent detection and replies built from the live scene.
- `src/lib/progress.ts` — progress repository + store (validated, cross-tab synced). `src/lib/use-progress.ts` is the React binding.

All simulation state is a flat `SimValues` bag of numbers (including `fault`). Models never read React state; they are pure so they can be unit tested and later driven by a 3D scene.

## 3. Lesson flow (4 steps)

1. **Real-world story** (≈30 s) — overlay on the stage.
2. **Interactive explanation** — _Guided Discovery_: each step applies a start state, asks the student to change a variable, and verifies it live (`GuidedStep.done`). In _free_ mode the same content is shown as plain cards.
3. **Free exploration** — all sliders, view toggle, subject layers, optional **Real-World Error Mode** (inject faults; hazards always evaluated).
4. **Visual quiz** — wrong answers link to a simulation state with a before / claimed / actual comparison and a way back to the quiz (quiz state lives in `useQuiz`, so it survives leaving the step).

## 4. Real-World Error Mode

`simExtras.hazards(values)` is pure and returns `warning` / `critical` hazards with _cause_, _real consequence_ and _fix_. They drive:

- the stage overlay (vignette, shake, sparks) and banner,
- the control panel hazard list,
- the AI tutor (`hazard` intent and appended to "why" answers).

Faults (`values.fault` ≠ 0) are only selectable when Error Mode is on; hazards from extreme slider values are always reported — silent failure is not allowed.

## 5. Progress & persistence

- `ProgressRepository` is the storage seam (`load`, `save`, `subscribe`). Today: `localStorage` keyed by user id (`guest` until accounts exist).
- Everything read from storage is **untrusted**: parsed in try/catch, shape-checked, numbers clamped, unknown lesson ids dropped, entries capped.
- Cross-tab sync through the `storage` event; SSR-safe via `useSyncExternalStore` server snapshot (no hydration mismatch).
- XP is only awarded for _improvement_ over the best score (no farming).
- Swapping in an account-backed repository (REST / DB) only requires implementing the interface.

## 6. Security checklist

- No `dangerouslySetInnerHTML`, no `eval`; all text (including tutor replies and free-text input) is rendered as React text. Free-text input is length-capped.
- URL search params are validated (`validateSearch`) and fall back to safe defaults.
- No secrets in the repo; the tutor is local/mocked. A real LLM must be called server-side only.
- Persisted data is validated on read (see §5).

## 7. Performance notes

- Animation clock lives inside `SimulationStage`; only the stage re-renders per frame.
- Heavy derived data (graph, readouts, hazards) is memoised on `values`.
- Timers / listeners are cleaned up on unmount; clock stops when playing is off.
- Scenes render client-side only (useIsClient): Math.sin/cos differ in the last digits between Node and the browser, which caused hydration mismatches.
- The story overlay scrolls inside the stage so it is never hidden behind the toolbar on small screens.

## 8. Known limitations / next steps

- Each subject currently has one simulation shared by all its lessons (mock mapping in `mockCurriculum.ts`).
- Stage is a 2D SVG preview; mount Three.js at the `TODO` in `SimulationStage.tsx`.
- No real accounts/server yet: progress is per browser profile. Cross-device sync needs a backend implementing `ProgressRepository`.
