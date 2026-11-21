import { describe, it, expect } from "vitest";
import { supportMindMap, findNode, collectBlockIds } from "@/data/lessons/supportMindMap";
import { supportBlocks } from "@/data/lessons/supportLesson";
import type { MindMapNode } from "@/data/lessons/supportTypes";
import { layoutMindMapTree } from "@/components/lesson/board/MindMapLab";

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

describe("layoutMindMapTree", () => {
  it("calculates non-overlapping positions for all nodes", () => {
    const expanded = new Set(["root", "plant", "human"]);
    const layout = layoutMindMapTree(supportMindMap.root, expanded);

    // Collect all node rectangles
    const rects: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [];

    function collectRects(l: typeof layout) {
      rects.push({
        id: l.node.id,
        x1: l.x,
        y1: l.y - l.height / 2,
        x2: l.x + l.width,
        y2: l.y + l.height / 2,
      });
      l.children.forEach(collectRects);
    }
    collectRects(layout);

    // Check no overlapping
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i]!;
        const b = rects[j]!;
        const overlaps = a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
        expect(overlaps, `Nodes ${a.id} and ${b.id} overlap`).toBe(false);
      }
    }
  });

  it("positions root at level 0", () => {
    const expanded = new Set(["root"]);
    const layout = layoutMindMapTree(supportMindMap.root, expanded);
    expect(layout.x).toBe(50);
    expect(layout.node.id).toBe("root");
  });

  it("expands children when node is in expanded set", () => {
    const expanded = new Set(["root", "plant"]);
    const layout = layoutMindMapTree(supportMindMap.root, expanded);
    expect(layout.children.length).toBeGreaterThan(0);

    const plantChild = layout.children.find((c) => c.node.id === "plant");
    expect(plantChild).toBeDefined();
    expect(plantChild!.x).toBeGreaterThan(layout.x);
  });

  it("collapses children when node not in expanded set", () => {
    const expanded = new Set(["root"]);
    const layout = layoutMindMapTree(supportMindMap.root, expanded);
    // Root is expanded, so children should be shown
    // But if we remove root from expanded, children should be hidden
    const collapsed = new Set<string>();
    const layoutCollapsed = layoutMindMapTree(supportMindMap.root, collapsed);
    expect(layoutCollapsed.children.length).toBe(0);
  });
});

describe("empty grid test mode", () => {
  it("collects all leaf nodes with blockId for testing", () => {
    const leafNodes: MindMapNode[] = [];
    function collect(node: MindMapNode) {
      if (node.blockId && (!node.children || node.children.length === 0)) {
        leafNodes.push(node);
      }
      if (node.children) {
        node.children.forEach(collect);
      }
    }
    collect(supportMindMap.root);

    expect(leafNodes.length, "Expected at least 10 testable leaf nodes").toBeGreaterThanOrEqual(10);

    // Each leaf node should have a valid blockId
    const validBlocks = new Set(supportBlocks.map((b) => b.n));
    for (const node of leafNodes) {
      expect(validBlocks.has(node.blockId!), `Leaf node ${node.id} has invalid blockId`).toBe(true);
    }
  });
});
