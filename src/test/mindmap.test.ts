import { describe, it, expect } from "vitest";
import { supportMindMap, findNode, collectBlockIds } from "@/data/lessons/supportMindMap";
import { supportBlocks } from "@/data/lessons/supportLesson";
import type { MindMapNode } from "@/data/lessons/supportTypes";

describe("supportMindMap", () => {
  it("has valid blockId references", () => {
    const validBlocks = new Set(supportBlocks.map((b) => b.n));

    function checkNode(node: MindMapNode) {
      if (node.blockId) {
        expect(
          validBlocks.has(node.blockId),
          `Node ${node.id} has invalid blockId ${node.blockId}`,
        ).toBe(true);
      }
      if (node.children) {
        for (const child of node.children) {
          checkNode(child);
        }
      }
    }

    checkNode(supportMindMap.root);
  });

  it("finds nodes by id", () => {
    const node = findNode(supportMindMap.root, "spine");
    expect(node).toBeDefined();
    expect(node?.title.ar).toBe("العمود الفقري");
    expect(node?.title.en).toBe("Vertebral column");
  });

  it("returns null for non-existent node", () => {
    const node = findNode(supportMindMap.root, "non-existent");
    expect(node).toBeNull();
  });

  it("collects blockIds from subtree", () => {
    const spine = findNode(supportMindMap.root, "spine");
    expect(spine).toBeDefined();
    const ids = collectBlockIds(spine!);
    expect(ids).toContain(5);
    expect(ids).toContain(6);
  });

  it("covers all 14 blocks", () => {
    const allIds = collectBlockIds(supportMindMap.root);
    for (let i = 1; i <= 14; i++) {
      expect(allIds, `Block ${i} not covered in mind map`).toContain(i);
    }
  });
});
