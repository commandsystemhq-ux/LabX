import {
  DEFAULT_GRADE,
  curriculum,
  findLesson,
  getGrade,
  subjectMastery,
  subjects,
  type GradeId,
} from "@/data/mockCurriculum";
import { sanitizeProgress, studentStats } from "@/lib/progress";

/**
 * What Noor knows about the signed-in student. Built on the server only, from the user that the
 * access token resolves to (never from anything the browser claims) plus that same user's saved
 * progress row. The profile is rendered as plain data for the system prompt: the only free text
 * in it is the display name, which is reduced to letters / digits / spaces.
 */

const MASTERED_AT = 85;

export interface StudentProfile {
  role: "student" | "admin";
  name: string;
  firstName: string;
  nameSource: "profile" | "email_guess" | "unknown";
  /** Grade of the student's most recent activity, if they have any. */
  mainGrade: GradeId | null;
  viewingGrade: GradeId | null;
  xp: number;
  level: number;
  streak: number;
  started: number;
  mastered: number;
  subjects: { name: string; percent: number; mastered: number; started: number; total: number }[];
  lastLesson: {
    title: string;
    subject: string;
    grade: GradeId;
    step: number;
    mastery: number;
  } | null;
}

/** Letters, marks, digits, spaces, apostrophes and hyphens only: no tags, quotes, brackets or newlines. */
const NAME_STRIP = /[^\p{L}\p{M}\p{N} '’-]/gu;

export function cleanName(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(NAME_STRIP, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 4)
    .join(" ")
    .slice(0, 30)
    .trim();
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Display name from the profile, else a first name guessed from the e-mail (never the address itself). */
export function resolveName(
  displayName: string | null | undefined,
  email: string | null | undefined,
) {
  const explicit = cleanName(displayName ?? "");
  if (explicit.length >= 2) {
    return {
      name: explicit,
      firstName: explicit.split(" ")[0] ?? explicit,
      source: "profile" as const,
    };
  }
  const local = (email ?? "").split("@")[0] ?? "";
  const token = local
    .split(/[._+-]+/)
    .map((t) => cleanName(t.replace(/\d+/g, "")))
    .find((t) => t.length >= 2);
  if (token) {
    const first = cap(token.split(" ")[0] ?? token);
    return { name: first, firstName: first, source: "email_guess" as const };
  }
  return { name: "", firstName: "", source: "unknown" as const };
}

export function buildStudentProfile(opts: {
  role: string | null;
  displayName?: string | null | undefined;
  email?: string | null | undefined;
  /** The raw `user_progress.state` of THIS user (untrusted: validated here). */
  progress: unknown;
  viewingGrade?: GradeId | undefined;
  lang: "ar" | "en";
  today?: string;
}): StudentProfile {
  const who = resolveName(opts.displayName, opts.email);
  const state = sanitizeProgress(opts.progress);
  const stats = studentStats(state, opts.today);
  const entries = Object.entries(state.lessons);

  let latest: { id: string; updatedAt: number } | null = null;
  for (const [id, l] of entries) {
    if (!latest || l.updatedAt > latest.updatedAt) latest = { id, updatedAt: l.updatedAt };
  }
  const last = latest ? findLesson(latest.id) : null;
  const lastProgress = latest ? state.lessons[latest.id] : undefined;
  const mainGrade = last?.grade.id ?? null;

  const gradeForSubjects = mainGrade ?? opts.viewingGrade ?? DEFAULT_GRADE;
  const mastery = (id: string) => state.lessons[id]?.mastery ?? 0;
  const subjectRows = subjects.map((s) => {
    const units = curriculum[gradeForSubjects][s.id];
    const lessons = units.flatMap((u) => u.lessons);
    return {
      name: s.name[opts.lang],
      percent: subjectMastery(units, (l) => mastery(l.id)),
      mastered: lessons.filter((l) => mastery(l.id) >= MASTERED_AT).length,
      started: lessons.filter((l) => state.lessons[l.id]).length,
      total: lessons.length,
    };
  });

  return {
    role: opts.role === "admin" ? "admin" : "student",
    name: who.name,
    firstName: who.firstName,
    nameSource: who.source,
    mainGrade,
    viewingGrade: opts.viewingGrade ?? null,
    xp: stats.xp,
    level: stats.level,
    streak: stats.streak,
    started: entries.length,
    mastered: entries.filter(([, l]) => l.mastery >= MASTERED_AT).length,
    subjects: subjectRows,
    lastLesson:
      last && lastProgress
        ? {
            title: last.lesson.title[opts.lang],
            subject: last.subject.name[opts.lang],
            grade: last.grade.id,
            step: lastProgress.step,
            mastery: lastProgress.mastery,
          }
        : null,
  };
}

const gradeLabel = (g: GradeId) => `${getGrade(g)?.name.en ?? g} (${g})`;

/**
 * The `<student_profile>` block for the system prompt. `null` = nobody is signed in (a guest).
 * Every value is either a number, a fixed label, curriculum text or the sanitised name.
 */
export function formatStudentProfile(profile: StudentProfile | null): string {
  if (!profile) {
    return [
      "<student_profile>",
      "status: guest",
      "name: unknown",
      "progress: not saved (a guest has no account)",
      "</student_profile>",
    ].join("\n");
  }
  const lines = [
    "<student_profile>",
    "status: signed_in",
    `role: ${profile.role}`,
    profile.name ? `name: "${profile.name}"` : "name: unknown",
    profile.firstName ? `first_name: "${profile.firstName}"` : "",
    `name_source: ${profile.nameSource}`,
    `main_grade: ${profile.mainGrade ? gradeLabel(profile.mainGrade) : "unknown (no activity yet)"}`,
    profile.viewingGrade ? `currently_browsing_grade: ${profile.viewingGrade}` : "",
    `xp: ${profile.xp}`,
    `level: ${profile.level}`,
    `streak_days: ${profile.streak}`,
    `lessons_started: ${profile.started}`,
    `lessons_mastered (quiz score >= ${MASTERED_AT}%): ${profile.mastered}`,
    `subject_progress: ${profile.subjects
      .map(
        (s) => `${s.name} ${s.percent}% (${s.mastered}/${s.total} mastered, ${s.started} started)`,
      )
      .join("; ")}`,
    profile.lastLesson
      ? `last_lesson: "${profile.lastLesson.title}" (${profile.lastLesson.subject}, ${profile.lastLesson.grade}), step ${profile.lastLesson.step} of 4, mastery ${profile.lastLesson.mastery}%`
      : "last_lesson: none yet",
    "</student_profile>",
  ];
  return lines.filter(Boolean).join("\n");
}
