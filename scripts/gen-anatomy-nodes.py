import struct, json
out = ["// GENERATED from public/models/anatomy/{skeleton,muscles}.glb by scripts/gen-anatomy-nodes.py — do not edit.",
       "// Node names of the BodyParts3D files, so scenes can plan what to show before the files download.", ""]
for name, const in (("skeleton","SKELETON_NODES"),("muscles","MUSCLE_NODES")):
    b = open(f"public/models/anatomy/{name}.glb","rb").read()
    l = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20+l])
    names = [n.get("name","") for n in j["nodes"]]
    out.append(f"export const {const}: readonly string[] = {json.dumps(names)};")
    out.append("")
open("src/data/lessons/anatomyNodes.ts","w",encoding="utf-8").write("\n".join(out))
print("ok")
