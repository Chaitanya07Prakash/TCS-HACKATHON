import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.opportunityEligibility.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.noticeRequirement.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.placementPreference.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('Creating users...');
  const student1 = await prisma.user.create({
    data: {
      email: 'arjun@campus.edu',
      passwordHash,
      name: 'Arjun Mehta',
      branch: 'CSE',
      year: 3,
      semester: 6,
      graduationYear: 2026,
      cgpa: 8.8,
      skills: { create: [{ name: 'React' }, { name: 'Node.js' }, { name: 'TypeScript' }] },
      interests: { create: [{ name: 'Web Development' }, { name: 'AI' }] },
      placementPreference: {
        create: { preferredRoles: JSON.stringify(['SDE', 'Frontend Engineer']), expectedCtc: 12.0, locations: JSON.stringify(['Bangalore', 'Hyderabad']) },
      },
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'sneha@campus.edu',
      passwordHash,
      name: 'Sneha Rao',
      branch: 'ECE',
      year: 2,
      semester: 4,
      graduationYear: 2027,
      cgpa: 7.2,
      skills: { create: [{ name: 'Python' }, { name: 'C++' }, { name: 'IoT' }] },
      interests: { create: [{ name: 'Robotics' }, { name: 'Data Science' }] },
      placementPreference: {
        create: { preferredRoles: JSON.stringify(['Data Analyst', 'Hardware Engineer']), expectedCtc: 8.0, locations: JSON.stringify(['Pune']) },
      },
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'vikram@campus.edu',
      passwordHash,
      name: 'Vikram Das',
      branch: 'MECH',
      year: 4,
      semester: 8,
      graduationYear: 2025,
      cgpa: 6.5,
      skills: { create: [{ name: 'AutoCAD' }, { name: 'SolidWorks' }] },
      interests: { create: [{ name: 'Automobile' }, { name: 'Manufacturing' }] },
      placementPreference: {
        create: { preferredRoles: JSON.stringify(['Design Engineer']), expectedCtc: 6.0, locations: JSON.stringify(['Chennai']) },
      },
    },
  });

  console.log('Creating 5 test notices...');
  
  const notice1 = await prisma.notice.create({
    data: {
      title: 'Google Campus Recruitment 2026',
      description: 'Google is visiting our campus for SDE roles.',
      category: 'PLACEMENT',
      rawText: 'Google is visiting our campus for SDE roles. Open for CSE and IT branches with CGPA > 8.0.',
      deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      requirements: {
        create: {
          branches: JSON.stringify(['CSE', 'IT']),
          minimumCGPA: 8.0,
          graduationYears: JSON.stringify([2026]),
          years: JSON.stringify([3, 4]),
          skills: JSON.stringify(['Java', 'C++', 'Python'])
        },
      },
      opportunity: {
        create: {
          organization: 'Google',
          title: 'Google SDE Application',
          description: 'Apply for the Software Development Engineer role at Google.',
          category: 'PLACEMENT',
        },
      },
    },
  });

  const notice2 = await prisma.notice.create({
    data: {
      title: 'State Merit Scholarship 2024',
      description: 'Applications are open for the State Merit Scholarship.',
      category: 'SCHOLARSHIP',
      rawText: 'Applications are open for the State Merit Scholarship. All branches eligible, requires min CGPA of 8.5.',
      deadline: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000),
      requirements: {
        create: {
          branches: JSON.stringify([]),
          years: JSON.stringify([]),
          minimumCGPA: 8.5,
          graduationYears: JSON.stringify([]),
          skills: JSON.stringify([])
        },
      },
      opportunity: {
        create: {
          organization: 'State Govt',
          title: 'State Merit Scholarship',
          description: 'Financial assistance for meritorious students.',
          category: 'SCHOLARSHIP',
        },
      },
    },
  });

  const notice3 = await prisma.notice.create({
    data: {
      title: 'Smart India Hackathon (SIH) 2026 Internal Selection',
      description: 'Register your teams for SIH internal hackathon.',
      category: 'COMPETITION',
      rawText: 'Register your teams for SIH internal hackathon. We are looking for web and app development enthusiasts.',
      deadline: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
      requirements: {
        create: {
          branches: JSON.stringify([]),
          years: JSON.stringify([]),
          graduationYears: JSON.stringify([]),
          skills: JSON.stringify(['Web Development', 'React', 'Node.js']),
        },
      },
      opportunity: {
        create: {
          organization: 'SIH',
          title: 'SIH Internal Registration',
          description: 'Register for the internal selection round of SIH.',
          category: 'COMPETITION',
        },
      },
    },
  });

  const notice4 = await prisma.notice.create({
    data: {
      title: 'Mid-Semester Examination Schedule - ECE',
      description: 'The mid-semester exams for ECE will commence next Monday.',
      category: 'EXAMINATION',
      rawText: 'T I M E T A B L E \n\n E C E 2 n d Y e a r \n\n M I D - S E M E S T E R \n\n Commencing next Monday.',
      eventDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
      requirements: {
        create: {
          branches: JSON.stringify(['ECE']),
          years: JSON.stringify([2]),
          graduationYears: JSON.stringify([]),
          skills: JSON.stringify([])
        },
      },
    },
  });

  const notice5 = await prisma.notice.create({
    data: {
      title: 'Robotics Workshop by TechClub',
      description: 'A hands-on workshop on IoT and Robotics for all interested students.',
      category: 'EVENT',
      rawText: 'A hands-on workshop on IoT and Robotics for MECH, ECE, and CSE students.',
      eventDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
      requirements: {
        create: {
          branches: JSON.stringify(['MECH', 'ECE', 'CSE']),
          years: JSON.stringify([]),
          graduationYears: JSON.stringify([]),
          skills: JSON.stringify(['Robotics', 'IoT'])
        },
      },
      opportunity: {
        create: {
          organization: 'TechClub',
          title: 'Robotics Workshop Registration',
          description: 'Register to secure your seat in the workshop.',
          category: 'EVENT',
        },
      },
    },
  });

  console.log('Creating explicit eligibility and task for Arjun...');
  const googleOpp = await prisma.opportunity.findFirst({ where: { noticeId: notice1.id } });
  
  if (googleOpp) {
    await prisma.opportunityEligibility.create({
      data: {
        userId: student1.id,
        opportunityId: googleOpp.id,
        eligible: true,
        score: 95,
        priority: 'HIGH',
        reasons: JSON.stringify([
          'Branch CSE matches requirement',
          'CGPA 8.8 >= 8.0 satisfied',
          'Graduation year 2026 matches'
        ])
      }
    });

    await prisma.task.create({
      data: {
        userId: student1.id,
        noticeId: notice1.id,
        title: 'Register for Google Campus Recruitment',
        description: 'Complete the Google SDE application process before the deadline.',
        deadline: new Date('2026-09-19T23:59:59Z'),
        priority: 'HIGH',
        status: 'PENDING'
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
