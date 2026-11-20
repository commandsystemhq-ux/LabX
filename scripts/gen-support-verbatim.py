import re, json, io
src = open("docs/lesson1.txt", encoding="utf-8").read().replace("\r\n", "\n").split("\n")
title = src[0]
sections = []
expect = 1
cur = None
for raw in src[1:]:
    if not raw.strip():
        continue
    m = re.match(r"^(\d+)\. (.+)$", raw)
    if m and int(m.group(1)) == expect and not raw.startswith(" "):
        cur = {"n": expect, "title": m.group(2).strip(), "lines": []}
        sections.append(cur)
        expect += 1
        continue
    indent = len(raw) - len(raw.lstrip(" "))
    body = raw.strip()
    if body.startswith("* "):
        cur["lines"].append([indent // 2, body[2:], 0])
    else:
        cur["lines"].append([indent // 2, body, 1])
assert len(sections) == 14, len(sections)
out = io.StringIO()
out.write("// GENERATED from docs/lesson1.txt by scripts/gen-support-verbatim.py — do not edit by hand.\n")
out.write("// Every line of the textbook report, in order, with its nesting depth.\n\n")
out.write("/** [depth, text, plain] — `plain` lines are paragraphs / numbered items that had no bullet in the source. */\n")
out.write("export type VerbatimLine = readonly [depth: number, text: string, plain?: 1];\n\n")
out.write("export interface VerbatimSection {\n  n: number;\n  title: string;\n  lines: readonly VerbatimLine[];\n}\n\n")
out.write("export const supportReportTitle = %s;\n\n" % json.dumps(title, ensure_ascii=False))
out.write("export const supportSections: readonly VerbatimSection[] = [\n")
for s in sections:
    out.write("  {\n    n: %d,\n    title: %s,\n    lines: [\n" % (s["n"], json.dumps(s["title"], ensure_ascii=False)))
    for d, t, p in s["lines"]:
        out.write("      [%d, %s%s],\n" % (d, json.dumps(t, ensure_ascii=False), ", 1" if p else ""))
    out.write("    ],\n  },\n")
out.write("];\n")
open("src/data/lessons/supportVerbatim.ts", "w", encoding="utf-8").write(out.getvalue())
print(sum(len(s["lines"]) for s in sections), "lines;", [len(s["lines"]) for s in sections])
