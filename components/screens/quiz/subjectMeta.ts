import { Database, Cpu, Network, GitBranch, Sigma, BookOpen, type LucideIcon } from 'lucide-react-native';
import type { CardTone } from '@/lib/theme';

type SubjectMeta = { icon: LucideIcon; tone: CardTone };

const subjectMeta: Record<string, SubjectMeta> = {
  DBMS: { icon: Database, tone: 'lavender' },
  OS: { icon: Cpu, tone: 'mint' },
  CN: { icon: Network, tone: 'sky' },
  DSA: { icon: GitBranch, tone: 'peach' },
  Maths: { icon: Sigma, tone: 'butter' },
};

const fallback: SubjectMeta = { icon: BookOpen, tone: 'lavender' };

export function getSubjectMeta(subject: string): SubjectMeta {
  return subjectMeta[subject] ?? fallback;
}
