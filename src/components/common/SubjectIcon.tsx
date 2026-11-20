import { Atom, Dna, Zap, type LucideProps } from "lucide-react";
import type { SubjectId } from "@/data/mockCurriculum";

const ICONS = { biology: Dna, physics: Zap, chemistry: Atom } as const;

export function SubjectIcon({ subject, ...props }: { subject: SubjectId } & LucideProps) {
  const Icon = ICONS[subject];
  return <Icon {...props} />;
}
