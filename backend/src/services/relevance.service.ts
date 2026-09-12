import { User, Skill, Interest, NoticeRequirement } from '@prisma/client';

type FullUser = User & { skills: Skill[], interests: Interest[] };

export const calculateRelevance = (
  user: FullUser,
  requirements: NoticeRequirement | null,
  isEligible: boolean
): { score: number; priority: string; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];
  
  if (isEligible) {
    score += 10;
    reasons.push("Base eligibility criteria met");
  }

  if (!requirements) {
    return { score, priority: 'LOW', reasons };
  }

  const branches = JSON.parse(requirements.branches) as string[];
  const graduationYears = JSON.parse(requirements.graduationYears) as number[];
  const skills = JSON.parse(requirements.skills) as string[];

  if (branches.length > 0) {
    if (branches.map(b => b.toUpperCase()).includes(user.branch.toUpperCase())) {
      score += 30;
      reasons.push(`Branch matches: ${user.branch}`);
    }
  }

  if (graduationYears.length > 0) {
    if (graduationYears.includes(user.graduationYear)) {
      score += 20;
      reasons.push(`Graduation year matches: ${user.graduationYear}`);
    }
  }

  if (requirements.minimumCGPA !== null) {
    if (user.cgpa >= requirements.minimumCGPA) {
      score += 15;
      reasons.push(`CGPA ${user.cgpa} satisfies requirement ${requirements.minimumCGPA}`);
    }
  }

  if (skills.length > 0) {
    const requiredSkills = skills.map((s: string) => s.toLowerCase());
    const userSkills = user.skills.map(s => s.name.toLowerCase());
    const overlap = requiredSkills.filter((s: string) => userSkills.includes(s)).length;
    if (overlap > 0) {
      score += Math.min(10, (overlap / requiredSkills.length) * 10);
      reasons.push(`Matches ${overlap} required skills`);
    }
  }

  score = Math.min(100, Math.round(score));

  let priority = 'LOW';
  if (score >= 80) priority = 'HIGH';
  else if (score >= 50) priority = 'MEDIUM';

  return { score, priority, reasons };
};
