import type { MindMapData, MindMapNode } from "./supportTypes";
import { SUPPORT_LESSON_ID } from "./supportTypes";

/**
 * Interactive mind map for the "Support in living organisms" lesson.
 * Covers all numbers and branches from the textbook, linked to blocks and 3D views.
 */

const t = (ar: string, en: string) => ({ ar, en });

const plantBranch: MindMapNode = {
  id: "plant",
  title: t("النبات", "Plant"),
  badge: t("خلية وأنسجة", "Cell and tissues"),
  summary: t(
    "الخلية النباتية، الأنسجة البسيطة والمركبة، المواد المترسبة، الساق العشبية والخشبية",
    "Plant cell, simple and complex tissues, deposited materials, herb and woody stems",
  ),
  children: [
    {
      id: "plant-cell",
      title: t("الخلية النباتية", "Plant cell"),
      badge: t("جدار سيليلوزي", "Cellulose wall"),
      summary: t(
        "وحدة البناء، تتميز بجدار خلوي أساسه السيليلوز",
        "Unit of structure, distinguished by a cell wall made of cellulose",
      ),
      blockId: 1,
      supports3D: true,
    },
    {
      id: "simple-tissues",
      title: t("الأنسجة البسيطة", "Simple tissues"),
      badge: t("3 أنواع", "3 types"),
      summary: t(
        "بارانشيمي (حي، رقيق)، كولنشيمي (حي، مغلظ الأركان)، إسكرلنشيمي (غير حي، مغلظ)",
        "Parenchyma (living, thin), Collenchyma (living, corner-thickened), Sclerenchyma (non-living, thickened)",
      ),
      blockId: 1,
      supports3D: true,
      children: [
        {
          id: "parenchyma",
          title: t("البارانشيمي", "Parenchyma"),
          badge: t("حي، رقيق الجدر", "Living, thin walls"),
          summary: t(
            "خلايا كروية، جدر سيليلوزية رقيقة مرنة، مسافات بينية",
            "Round cells, thin flexible cellulose walls, intercellular spaces",
          ),
          blockId: 1,
        },
        {
          id: "collenchyma",
          title: t("الكولنشيمي", "Collenchyma"),
          badge: t("حي، مغلظ الأركان", "Living, corner-thickened"),
          summary: t(
            "خلايا حية، تغليظ غير منتظم بالسيليلوز في الأركان",
            "Living cells, irregular cellulose thickening at corners",
          ),
          blockId: 1,
        },
        {
          id: "sclerenchyma",
          title: t("الإسكرلنشيمي", "Sclerenchyma"),
          badge: t("غير حي، مغلظ", "Non-living, thickened"),
          summary: t(
            "خلايا غير حية، جدر مغلظة باللجنين",
            "Non-living cells, walls thickened with lignin",
          ),
          blockId: 1,
        },
      ],
    },
    {
      id: "complex-tissues",
      title: t("الأنسجة المركبة", "Complex tissues"),
      badge: t("خشب ولحاء", "Xylem and phloem"),
      summary: t(
        "الخشب: أوعية وقصيبات مغلظة باللجنين (ما عدا النقر). اللحاء: أنابيب غربالية وخلايا مرافقة",
        "Xylem: vessels and tracheids thickened with lignin (except pits). Phloem: sieve tubes and companion cells",
      ),
      blockId: 1,
      supports3D: true,
      children: [
        {
          id: "xylem",
          title: t("الخشب", "Xylem"),
          badge: t("ماء وأملاح", "Water and minerals"),
          summary: t(
            "أوعية وقصيبات مغلظة باللجنين ما عدا النقر، يوصل الماء والأملاح",
            "Vessels and tracheids thickened with lignin except pits, conducts water and minerals",
          ),
          blockId: 1,
        },
        {
          id: "phloem",
          title: t("اللحاء", "Phloem"),
          badge: t("مواد عضوية", "Organic materials"),
          summary: t(
            "أنابيب غربالية وخلايا مرافقة، ينقل المواد العضوية",
            "Sieve tubes and companion cells, carries organic materials",
          ),
          blockId: 1,
        },
      ],
    },
    {
      id: "deposited-materials",
      title: t("المواد المترسبة", "Deposited materials"),
      badge: t("4 مواد", "4 materials"),
      summary: t("سيليلوز، لجنين، كيوتين، سيوبرين", "Cellulose, lignin, cutin, suberin"),
      blockId: 2,
      children: [
        {
          id: "cellulose",
          title: t("السيليلوز", "Cellulose"),
          badge: t("جدار الخلية", "Cell wall"),
          summary: t(
            "مادة أساسية في جدار الخلية النباتية، مرنة",
            "Main material in plant cell wall, flexible",
          ),
          blockId: 1,
        },
        {
          id: "lignin",
          title: t("اللجنين", "Lignin"),
          badge: t("تصلب", "Hardening"),
          summary: t(
            "يترسب في الإسكرلنشيمي والخشب، يعطي صلابة",
            "Deposited in sclerenchyma and xylem, provides rigidity",
          ),
          blockId: 1,
        },
        {
          id: "cutin",
          title: t("الكيوتين", "Cutin"),
          badge: t("طبقة كيوتينية", "Cuticle layer"),
          summary: t(
            "يترسب في الطبقة الكيوتينية، يمنع فقد الماء",
            "Deposited in cuticle layer, prevents water loss",
          ),
          blockId: 2,
        },
        {
          id: "suberin",
          title: t("السيوبرين", "Suberin"),
          badge: t("طبقة فلينية", "Cork layer"),
          summary: t(
            "يترسب في الطبقة الفلينية، عازل للماء",
            "Deposited in cork layer, water-insoluble",
          ),
          blockId: 2,
        },
      ],
    },
    {
      id: "stem-types",
      title: t("أنواع الساق", "Stem types"),
      badge: t("عشبية وخشبية", "Herb and woody"),
      summary: t(
        "العشبية: أنسجة رقيقة. الخشبية: تغليظ باللجنين",
        "Herbaceous: thin tissues. Woody: lignin thickening",
      ),
      blockId: 2,
      supports3D: true,
      children: [
        {
          id: "herbaceous",
          title: t("الساق العشبية", "Herbaceous stem"),
          badge: t("أنسجة رقيقة", "Thin tissues"),
          summary: t("أنسجة رقيقة، دعامة ضعيفة نسبياً", "Thin tissues, relatively weak support"),
          blockId: 2,
        },
        {
          id: "woody",
          title: t("الساق الخشبية", "Woody stem"),
          badge: t("تغليظ باللجنين", "Lignin thickening"),
          summary: t("تغليظ باللجنين، دعامة قوية", "Lignin thickening, strong support"),
          blockId: 2,
        },
      ],
    },
  ],
};

const humanBranch: MindMapNode = {
  id: "human",
  title: t("الإنسان", "Human"),
  badge: t("206 عظمة", "206 bones"),
  summary: t(
    "الهيكل العظمي: محوري (80) وطرفي (126). الطفل 270–300 عظمة",
    "Skeleton: axial (80) and appendicular (126). Child has 270–300 bones",
  ),
  children: [
    {
      id: "axial",
      title: t("الهيكل المحوري", "Axial skeleton"),
      badge: t("80 عظمة", "80 bones"),
      summary: t("العمود الفقري، الجمجمة، القفص الصدري", "Vertebral column, skull, thoracic cage"),
      children: [
        {
          id: "spine",
          title: t("العمود الفقري", "Vertebral column"),
          badge: t("26 عظمة / 33 فقرة", "26 bones / 33 vertebrae"),
          summary: t(
            "33 فقرة في 5 مجموعات، 4 انحناءات، الفقرة النموذجية 7 نتوءات",
            "33 vertebrae in 5 groups, 4 curvatures, typical vertebra has 7 processes",
          ),
          blockId: 5,
          supports3D: true,
          children: [
            {
              id: "spine-groups",
              title: t("مجموعات الفقرات", "Vertebral groups"),
              badge: t("5 مجموعات", "5 groups"),
              summary: t(
                "عنقية (7)، صدرية (12)، قطنية (5)، عجزية (5)، عصعصية (4)",
                "Cervical (7), Thoracic (12), Lumbar (5), Sacral (5), Coccygeal (4)",
              ),
              blockId: 5,
            },
            {
              id: "spine-curves",
              title: t("انحناءات العمود", "Spinal curvatures"),
              badge: t("4 انحناءات", "4 curvatures"),
              summary: t(
                "عنقية، صدرية، قطنية، عجزية عصعصية",
                "Cervical, thoracic, lumbar, sacrococcygeal",
              ),
              blockId: 5,
            },
            {
              id: "vertebra",
              title: t("الفقرة النموذجية", "Typical vertebra"),
              badge: t("7 نتوءات", "7 processes"),
              summary: t(
                "جسم، قوس، 7 نتوءات (2 مستعرضة، 4 مفصلية، 1 شوكية)",
                "Body, arch, 7 processes (2 transverse, 4 articular, 1 spinous)",
              ),
              blockId: 6,
              supports3D: true,
            },
          ],
        },
        {
          id: "skull",
          title: t("الجمجمة", "Skull"),
          badge: t("29 عظمة", "29 bones"),
          summary: t(
            "8 مخية + 14 وجهية + 6 سمعية + 1 لامية",
            "8 cranial + 14 facial + 6 auditory + 1 hyoid",
          ),
          blockId: 7,
          supports3D: true,
          children: [
            {
              id: "cranial",
              title: t("عظام المخ", "Cranial bones"),
              badge: t("8 عظام", "8 bones"),
              summary: t(
                "جبهية، جدارية (2)، صدغية (2)، قفوية، وتدية، غربالية",
                "Frontal, Parietal (2), Temporal (2), Occipital, Sphenoid, Ethmoid",
              ),
              blockId: 7,
            },
            {
              id: "facial",
              title: t("عظام الوجه", "Facial bones"),
              badge: t("14 عظمة", "14 bones"),
              summary: t(
                "فك علوي (2)، فك سفلي، أنف (2)، دمعية (2)، حنكية (2)، خد (2)، محجرية (2)",
                "Maxilla (2), Mandible, Nasal (2), Lacrimal (2), Palatine (2), Zygomatic (2), Inferior concha (2)",
              ),
              blockId: 7,
            },
            {
              id: "auditory",
              title: t("العظام السمعية", "Auditory bones"),
              badge: t("6 عظام", "6 bones"),
              summary: t(
                "3 في كل أذن: مطرقة، سندان، ركاب",
                "3 in each ear: malleus, incus, stapes",
              ),
              blockId: 7,
            },
            {
              id: "hyoid",
              title: t("العظمة اللامية", "Hyoid bone"),
              badge: t("1 عظمة", "1 bone"),
              summary: t(
                "عظمة واحدة، لا تتصل بأي عظمة أخرى",
                "Single bone, not connected to any other bone",
              ),
              blockId: 7,
            },
          ],
        },
        {
          id: "thorax",
          title: t("القفص الصدري", "Thoracic cage"),
          badge: t("25 عظمة + 12 فقرة", "25 bones + 12 vertebrae"),
          summary: t(
            "12 زوج ضلوع + عظمة القص. 22 متصلة بالقص. الضلوع العائمة 18–19",
            "12 pairs of ribs + sternum. 22 attach to sternum. Floating ribs 18–19",
          ),
          blockId: 8,
          supports3D: true,
          children: [
            {
              id: "ribs",
              title: t("الضلوع", "Ribs"),
              badge: t("12 زوج", "12 pairs"),
              summary: t(
                "24 ضلع. العشرة الأولى متصلة بالقص، الضلوع العائمة 11–12",
                "24 ribs. First 10 attach to sternum, floating ribs 11–12",
              ),
              blockId: 8,
            },
            {
              id: "sternum",
              title: t("عظمة القص", "Sternum"),
              badge: t("1 عظمة", "1 bone"),
              summary: t(
                "عظمة أمامية مفلطحة، مدببة من أسفل، جزؤها السفلي غضروفي",
                "Flat front bone, pointed at bottom, lower part cartilaginous",
              ),
              blockId: 8,
            },
            {
              id: "floating-ribs",
              title: t("الضلوع العائمة", "Floating ribs"),
              badge: t("الزوجان 11–12", "Pairs 11–12"),
              summary: t(
                "قصيران، لا يتصلان بالقص، يتصلان بالفقرتين 18 و19",
                "Short, do not attach to sternum, attach to vertebrae 18 and 19",
              ),
              blockId: 8,
            },
          ],
        },
      ],
    },
    {
      id: "appendicular",
      title: t("الهيكل الطرفي", "Appendicular skeleton"),
      badge: t("126 عظمة", "126 bones"),
      summary: t(
        "الحزام الصدري (4)، الطرفان العلويان (60)، الحزام الحوضي (2)، الطرفان السفليان (60)",
        "Pectoral girdle (4), Upper limbs (60), Pelvic girdle (2), Lower limbs (60)",
      ),
      children: [
        {
          id: "pectoral-girdle",
          title: t("الحزام الصدري", "Pectoral girdle"),
          badge: t("4 عظام", "4 bones"),
          summary: t("لوح الكتف (2) والترقوة (2)", "Scapula (2) and Clavicle (2)"),
          blockId: 9,
          supports3D: true,
          children: [
            {
              id: "scapula",
              title: t("لوح الكتف", "Scapula"),
              badge: t("2 عظمة", "2 bones"),
              summary: t("عظمة مثلثة، خلف الأضلاع", "Triangular bone, behind the ribs"),
              blockId: 9,
            },
            {
              id: "clavicle",
              title: t("الترقوة", "Clavicle"),
              badge: t("2 عظمة", "2 bones"),
              summary: t(
                "عظمة S الشكل، تصل لوح الكتف بعظمة القص",
                "S-shaped bone, connects scapula to sternum",
              ),
              blockId: 9,
            },
          ],
        },
        {
          id: "upper-limbs",
          title: t("الطرفان العلويان", "Upper limbs"),
          badge: t("60 عظمة", "60 bones"),
          summary: t(
            "30×2: عضد، زند وكعبرة، رسغ (8)، راحة (5)، أصابع (14)",
            "30×2: humerus, ulna and radius, carpus (8), metacarpus (5), phalanges (14)",
          ),
          blockId: 9,
          supports3D: true,
          children: [
            {
              id: "humerus",
              title: t("عظمة العضد", "Humerus"),
              badge: t("2 عظمة", "2 bones"),
              summary: t("عظمة واحدة في كل ذراع", "One bone in each arm"),
              blockId: 9,
            },
            {
              id: "radius-ulna",
              title: t("الكعبرة والزند", "Radius and ulna"),
              badge: t("4 عظام", "4 bones"),
              summary: t("الكعبرة (إبهام)، الزند (خنصر)", "Radius (thumb side), Ulna (pinky side)"),
              blockId: 9,
            },
            {
              id: "carpus",
              title: t("عظام الرسغ", "Carpus"),
              badge: t("16 عظمة", "16 bones"),
              summary: t("8 عظام في كل رسغ", "8 bones in each wrist"),
              blockId: 9,
            },
            {
              id: "metacarpus",
              title: t("عظام الراحة", "Metacarpus"),
              badge: t("10 عظام", "10 bones"),
              summary: t("5 عظام في كل راحة", "5 bones in each palm"),
              blockId: 9,
            },
            {
              id: "finger-phalanges",
              title: t("سلايات الأصابع", "Finger phalanges"),
              badge: t("28 عظمة", "28 bones"),
              summary: t(
                "14 في كل يد: الإبهام 2، الباقي 3×4",
                "14 in each hand: thumb 2, others 3×4",
              ),
              blockId: 9,
            },
          ],
        },
        {
          id: "pelvic-girdle",
          title: t("الحزام الحوضي", "Pelvic girdle"),
          badge: t("2 عظمة", "2 bones"),
          summary: t(
            "عظمتا الحوض، الارتفاق العاني، التجويف الحقي، الحوض 4 عظام",
            "Two hip bones, pubic symphysis, true pelvis, pelvis 4 bones",
          ),
          blockId: 10,
          supports3D: true,
          children: [
            {
              id: "hip-bones",
              title: t("عظمتا الحوض", "Hip bones"),
              badge: t("2 عظمة", "2 bones"),
              summary: t(
                "كل عظمة من 3: حرقفة، إسك، عانية",
                "Each bone has 3 parts: ilium, ischium, pubis",
              ),
              blockId: 10,
            },
            {
              id: "pubic-symphysis",
              title: t("الارتفاق العاني", "Pubic symphysis"),
              badge: t("مفصل ليفي", "Fibrous joint"),
              summary: t("اتصال ليفي بين عظمتا الحوض", "Fibrous connection between hip bones"),
              blockId: 10,
            },
            {
              id: "true-pelvis",
              title: t("التجويف الحقي", "True pelvis"),
              badge: t("تجويف", "Cavity"),
              summary: t("الجزء السفلي من الحوض", "Lower part of the pelvis"),
              blockId: 10,
            },
          ],
        },
        {
          id: "lower-limbs",
          title: t("الطرفان السفليان", "Lower limbs"),
          badge: t("60 عظمة", "60 bones"),
          summary: t(
            "30×2: فخذ، رضفة، قصبة وشظية، رصغ (7)، مشط (5)، أصابع (14)",
            "30×2: femur, patella, tibia and fibula, tarsus (7), metatarsus (5), phalanges (14)",
          ),
          blockId: 10,
          supports3D: true,
          children: [
            {
              id: "femur",
              title: t("عظمة الفخذ", "Femur"),
              badge: t("2 عظمة", "2 bones"),
              summary: t("أطول عظمة في الجسم", "Longest bone in the body"),
              blockId: 10,
            },
            {
              id: "patella",
              title: t("الرضفة", "Patella"),
              badge: t("2 عظمة", "2 bones"),
              summary: t("عظمة أمام الركبة", "Bone in front of the knee"),
              blockId: 10,
            },
            {
              id: "tibia-fibula",
              title: t("القصبة والشظية", "Tibia and fibula"),
              badge: t("4 عظام", "4 bones"),
              summary: t("القصبة (داخل)، الشظية (خارج)", "Tibia (inner), Fibula (outer)"),
              blockId: 10,
            },
            {
              id: "tarsus",
              title: t("عظام الرصغ", "Tarsus"),
              badge: t("14 عظمة", "14 bones"),
              summary: t("7 عظام في كل قدم", "7 bones in each foot"),
              blockId: 10,
            },
            {
              id: "metatarsus",
              title: t("عظام المشط", "Metatarsus"),
              badge: t("10 عظام", "10 bones"),
              summary: t("5 عظام في كل مشط", "5 bones in each metatarsus"),
              blockId: 10,
            },
            {
              id: "toe-phalanges",
              title: t("سلايات الأصابع", "Toe phalanges"),
              badge: t("28 عظمة", "28 bones"),
              summary: t(
                "14 في كل قدم: الإبهام 2، الباقي 3×4",
                "14 in each foot: big toe 2, others 3×4",
              ),
              blockId: 10,
            },
          ],
        },
      ],
    },
    {
      id: "cavities",
      title: t("التجاويف", "Cavities"),
      badge: t("6 تجاويف", "6 cavities"),
      summary: t(
        "جمجمة، حبل شوكي، صدر، بطن، حوض، مفاصل",
        "Cranial, spinal, thoracic, abdominal, pelvic, joint cavities",
      ),
      blockId: 3,
      supports3D: true,
    },
    {
      id: "skeleton-overview",
      title: t("نظرة عامة على الهيكل", "Skeleton overview"),
      badge: t("محوري وطرفي", "Axial and appendicular"),
      summary: t(
        "الهيكل المحوري (80 عظمة) والهيكل الطرفي (126 عظمة)",
        "Axial skeleton (80 bones) and appendicular skeleton (126 bones)",
      ),
      blockId: 4,
      supports3D: true,
    },
    {
      id: "cartilages",
      title: t("الغضاريف", "Cartilages"),
      badge: t("نسيج ضام", "Connective tissue"),
      summary: t("غضروف زجاجي، مرن، ليفي", "Hyaline, elastic, fibrous cartilage"),
      blockId: 11,
      supports3D: true,
    },
    {
      id: "joints",
      title: t("المفاصل", "Joints"),
      badge: t("3 أنواع", "3 types"),
      summary: t(
        "ليفية، غضروفية، زلالية (محدودة وواسعة)",
        "Fibrous, cartilaginous, synovial (limited and wide)",
      ),
      blockId: 12,
      supports3D: true,
      children: [
        {
          id: "fibrous-joints",
          title: t("المفاصل الليفية", "Fibrous joints"),
          badge: t("غير متحركة", "Immovable"),
          summary: t("اتصال ليفي بين العظام", "Fibrous connection between bones"),
          blockId: 12,
        },
        {
          id: "cartilaginous-joints",
          title: t("المفاصل الغضروفية", "Cartilaginous joints"),
          badge: t("محدودة الحركة", "Limited movement"),
          summary: t("اتصال غضروفي بين العظام", "Cartilaginous connection between bones"),
          blockId: 12,
        },
        {
          id: "synovial-joints",
          title: t("المفاصل الزلالية", "Synovial joints"),
          badge: t("واسعة الحركة", "Wide movement"),
          summary: t(
            "مفصل زلالي، سائل زلالي، غضروف مفصلي",
            "Synovial joint, synovial fluid, articular cartilage",
          ),
          blockId: 12,
        },
      ],
    },
    {
      id: "ligaments",
      title: t("الأربطة", "Ligaments"),
      badge: t("ربط العظام", "Bone connection"),
      summary: t(
        "أربطة تربط العظام ببعضها، مثل أربطة الركبة 4",
        "Ligaments connect bones, like the 4 knee ligaments",
      ),
      blockId: 13,
      supports3D: true,
      children: [
        {
          id: "knee-ligaments",
          title: t("أربطة الركبة", "Knee ligaments"),
          badge: t("4 أربطة", "4 ligaments"),
          summary: t(
            "الرباط الصليبي الأمامي والخلفي، الرباط الجانبي الداخلي والخارجي",
            "Anterior and posterior cruciate, medial and lateral collateral",
          ),
          blockId: 13,
          supports3D: true,
        },
      ],
    },
    {
      id: "tendons",
      title: t("الأوتار", "Tendons"),
      badge: t("ربط العضلات", "Muscle connection"),
      summary: t(
        "أوتار تربط العضلات بالعظام، مثل وتر أخيل",
        "Tendons connect muscles to bones, like the Achilles tendon",
      ),
      blockId: 14,
      supports3D: true,
      children: [
        {
          id: "achilles",
          title: t("وتر أخيل", "Achilles tendon"),
          badge: t("أقوى وتر", "Strongest tendon"),
          summary: t(
            "أقوى وأطول وتر في الجسم، يربط عضلة الساق بعظمة الكعب",
            "Strongest and longest tendon, connects calf muscle to heel bone",
          ),
          blockId: 14,
          supports3D: true,
          children: [
            {
              id: "achilles-causes",
              title: t("أسباب التمزق", "Causes of tear"),
              badge: t("3 أسباب", "3 causes"),
              summary: t(
                "إجهاد مفاجئ، ضغط متكرر، ضعف تدريجي",
                "Sudden stress, repeated pressure, gradual weakening",
              ),
              blockId: 14,
            },
            {
              id: "achilles-symptoms",
              title: t("أعراض التمزق", "Symptoms of tear"),
              badge: t("ألم وورم", "Pain and swelling"),
              summary: t(
                "ألم حاد، صوت فرقعة، صعوبة المشي",
                "Sharp pain, popping sound, difficulty walking",
              ),
              blockId: 14,
            },
            {
              id: "achilles-treatment",
              title: t("العلاج", "Treatment"),
              badge: t("جراحة أو تثبيت", "Surgery or immobilization"),
              summary: t("جراحة أو تثبيت بالجبس", "Surgery or cast immobilization"),
              blockId: 14,
            },
          ],
        },
      ],
    },
  ],
};

export const supportMindMap: MindMapData = {
  lessonId: SUPPORT_LESSON_ID,
  root: {
    id: "root",
    title: t("الدعامة في الكائنات الحية", "Support in living organisms"),
    badge: t("النبات والإنسان", "Plant and human"),
    summary: t(
      "الخلية والأنسجة في النبات، الهيكل العظمي في الإنسان",
      "Cell and tissues in plants, skeletal system in humans",
    ),
    children: [plantBranch, humanBranch],
  },
};

/** Flatten the tree to find a node by id. */
export function findNode(node: MindMapNode, id: string): MindMapNode | null {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

/** Collect all blockIds in a subtree. */
export function collectBlockIds(node: MindMapNode): number[] {
  const ids: number[] = [];
  if (node.blockId) ids.push(node.blockId);
  if (node.children) {
    for (const child of node.children) {
      ids.push(...collectBlockIds(child));
    }
  }
  return [...new Set(ids)];
}
