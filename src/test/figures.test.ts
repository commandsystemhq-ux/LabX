import { describe, expect, it } from "vitest";
import { labelBox } from "@/components/lesson/board/FigureSvg";
import { FIGURES } from "@/data/lessons/supportFigures";

/** Slots-mode chips are the widest label (112 × 20); every label must fit inside the figure and not touch another. */
describe("2D exam figures", () => {
  for (const figure of Object.values(FIGURES)) {
    it(`${figure.id}: labels stay inside the viewBox and do not overlap`, () => {
      const boxes = figure.callouts.map((c) => ({ id: c.id, ...labelBox(c) }));
      for (const b of boxes) {
        expect(b.x0, `${b.id} left`).toBeGreaterThanOrEqual(0);
        expect(b.y0, `${b.id} top`).toBeGreaterThanOrEqual(0);
        expect(b.x1, `${b.id} right`).toBeLessThanOrEqual(figure.w);
        expect(b.y1, `${b.id} bottom`).toBeLessThanOrEqual(figure.h);
      }
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i]!;
          const b = boxes[j]!;
          const hit = a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
          expect(hit, `${a.id} overlaps ${b.id}`).toBe(false);
        }
      }
    });
  }
});
