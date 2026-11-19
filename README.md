# LabX — لاب إكس

Interactive 3D science learning platform for Egyptian / MENA K-12 schools (Biology, Physics, Chemistry) with a context-aware AI tutor.

Frontend only: React 19, TanStack Start, Tailwind CSS v4, Recharts, Lucide. All content is mock data in `src/data`.

## Views

- `/` Landing page
- `/dashboard` Curriculum dashboard (grades, XP, streak, subject tabs, mastery)
- `/lesson` Lesson & simulation workspace (4-step flow, live graph, AI tutor, quiz, teacher board mode)

## Development

```sh
npm install
npm run dev      # start dev server
npm test         # vitest
npm run lint
npm run build
```

## Adding Three.js

`src/components/lesson/SimulationStage.tsx` contains a `TODO: Mount Three.js Canvas here` marker. The current SVG/HTML scenes in `src/components/lesson/scenes` are drop-in placeholders.

Brand assets live in `public/` (`logo-mark.png`, `favicon.ico`, `icon-*.png`, `og-image.png`).
