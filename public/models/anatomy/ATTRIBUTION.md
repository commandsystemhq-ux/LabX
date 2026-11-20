# Anatomy models: attribution and licence

The 3D anatomy in this folder is **BodyParts3D**, © The Database Center for Life Science (DBCLS),
licensed under **Creative Commons Attribution-Share Alike 2.1 Japan (CC BY-SA 2.1 JP)**:
<https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en>
(statement of the original service: <https://lifesciencedb.jp/bp3d/info/index.html#License>).

> Note: BodyParts3D is distributed under **CC BY-SA 2.1 Japan** (not CC BY 4.0). The ShareAlike
> clause applies to these `.glb` files and to any adaptation of them. The MIT licence of the
> reference application code (below) does **not** relicense the models.

Original work: Mitsuhashi N. et al., "BodyParts3D: 3D structure database for anatomical concepts",
Nucleic Acids Research 37 (2009), D782-D785. <https://doi.org/10.1093/nar/gkn613>

## Files

All models were prepared by the OrganUI project from BodyParts3D (recentred, uniformly scaled,
Y-up axes, triangulated, smooth normals, illustrative colours, converted to GLB; no invented
anatomy). They are copied here **unmodified**. The transform of each file (centre in millimetres and
scale) is applied at runtime in `src/components/lesson/scenes/adr3d-model.ts` so that all models share
one body coordinate system.

| File | Structures | Source repository (MIT code, CC BY-SA 2.1 JP models) | BodyParts3D version |
| --- | --- | --- | --- |
| `muscles.glb` | 177 skeletal muscles | <https://github.com/organui/muscles-3d> | 3.0 (STL mirror) |
| `skeleton.glb` | 242 bones, cartilage, discs | <https://github.com/organui/skeleton-3d> | 3.0 (STL mirror) |
| `vessels.glb` | 51 arteries and veins | <https://github.com/organui/vessels-3d> | 4.3 |
| `heart.glb` | 11 heart structures | <https://github.com/organui/heart-3d> | 4.0 |
| `brain.glb` | 19 brain structures | <https://github.com/organui/brain-3d> | 4.0 |
| `spinal-cord.glb` | spinal cord, nerve roots, vertebrae | <https://github.com/organui/spinal-cord-3d> | 4.3 |
| `adrenals.glb` | adrenal glands, kidneys, renal and suprarenal vessels | <https://github.com/organui/adrenals-3d> | 4.3 |

Each source repository documents the exact meshes, hashes and changes in its own
`public/models/ATTRIBUTION.md` and `manifest.json`. The atlas browser of the same author is
<https://github.com/ashemag/human-atlas>.

## Code licences

The reference viewers (`organui/*`, `ashemag/human-atlas`) are MIT-licensed. No code from them is
copied into LabX; only the model files above are used.

## Disclaimer

Neither DBCLS nor the OrganUI authors endorse LabX. The source states that the database can contain
missing or incorrect anatomical representations. LabX uses the models for teaching illustrations only.