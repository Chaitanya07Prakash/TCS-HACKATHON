import { User, NoticeRequirement } from '@prisma/client';

export const checkEligibility = (
  user: User,
  requirements?: NoticeRequirement | null
): boolean => {
  if (!requirements) return true;

  const branches = JSON.parse(requirements.branches) as string[];
  const years = JSON.parse(requirements.years) as number[];
  const graduationYears = JSON.parse(requirements.graduationYears) as number[];

  if (branches.length > 0) {
    if (!branches.map(b => b.toUpperCase()).includes(user.branch.toUpperCase())) {
      return false;
    }
  }

  if (years.length > 0) {
    if (!years.includes(user.year)) {
      return false;
    }
  }

  if (graduationYears.length > 0) {
    if (!graduationYears.includes(user.graduationYear)) {
      return false;
    }
  }

  if (requirements.minimumCGPA !== null) {
    if (user.cgpa < requirements.minimumCGPA) {
      return false;
    }
  }

  return true;
};
