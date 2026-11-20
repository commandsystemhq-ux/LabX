import { Fragment, type ReactNode } from "react";

/**
 * Light, safe Markdown for Noor's bubbles: headings, **bold**, `code`, bullet / numbered lists,
 * horizontal rules and line breaks. The text is parsed into plain data and rendered as React
 * elements (never as HTML), so nothing the model or a stored message contains can inject markup,
 * links, images or scripts.
 */

export type Inline = { kind: "text" | "bold" | "code"; value: string };
export type Block =
  | { kind: "heading"; inline: Inline[] }
  | { kind: "paragraph"; lines: Inline[][] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "rule" };

const MAX_TEXT = 4000;
const INLINE_RE = /(\*\*[^*\n]+\*\*|`[^`\n]+`)/;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  for (const part of text.split(INLINE_RE)) {
    if (!part) continue;
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      out.push({ kind: "bold", value: part.slice(2, -2) });
    } else if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      out.push({ kind: "code", value: part.slice(1, -1) });
    } else {
      out.push({ kind: "text", value: part });
    }
  }
  return out;
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: Inline[][] | null = null;
  let list: { ordered: boolean; items: Inline[][] } | null = null;

  const close = () => {
    if (paragraph) blocks.push({ kind: "paragraph", lines: paragraph });
    if (list) blocks.push({ kind: "list", ...list });
    paragraph = null;
    list = null;
  };

  for (const raw of source.slice(0, MAX_TEXT).split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      close();
      continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      close();
      blocks.push({ kind: "rule" });
      continue;
    }
    const heading = /^\s{0,3}#{1,4}\s+(.+)$/.exec(line);
    if (heading) {
      close();
      blocks.push({ kind: "heading", inline: parseInline(heading[1]!.replace(/\s#+$/, "")) });
      continue;
    }
    const bullet = /^\s*[-*•]\s+(.+)$/.exec(line);
    const numbered = /^\s*\d{1,2}[.)]\s+(.+)$/.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      const ordered = !bullet;
      if (paragraph || (list && list.ordered !== ordered)) close();
      list ??= { ordered, items: [] };
      list.items.push(parseInline(item[1]!));
      continue;
    }
    if (list) close();
    paragraph ??= [];
    paragraph.push(parseInline(line.trim()));
  }
  close();
  return blocks;
}

function renderInline(parts: Inline[]): ReactNode {
  return parts.map((p, i) =>
    p.kind === "bold" ? (
      <strong key={i} className="font-bold">
        {p.value}
      </strong>
    ) : p.kind === "code" ? (
      <code key={i} dir="ltr" className="rounded bg-muted px-1 font-mono text-[0.85em]">
        {p.value}
      </code>
    ) : (
      <Fragment key={i}>{p.value}</Fragment>
    ),
  );
}

export function NoorMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-2 break-words">
      {parseMarkdown(text).map((b, i) => {
        switch (b.kind) {
          case "heading":
            return (
              <p key={i} dir="auto" className="font-bold text-subject">
                {renderInline(b.inline)}
              </p>
            );
          case "rule":
            return <hr key={i} className="border-border" />;
          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            return (
              <Tag
                key={i}
                dir="auto"
                className={
                  "space-y-1 ps-5 " + (b.ordered ? "list-decimal" : "list-disc marker:text-subject")
                }
              >
                {b.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </Tag>
            );
          }
          default:
            return (
              <p key={i} dir="auto">
                {b.lines.map((line, j) => (
                  <Fragment key={j}>
                    {j > 0 && <br />}
                    {renderInline(line)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
