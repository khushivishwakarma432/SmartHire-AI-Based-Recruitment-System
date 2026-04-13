const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Job = require('../models/Job');
const User = require('../models/User');

dotenv.config();

const sampleJobs = [
  {
    title: 'Frontend Developer',
    department: 'Engineering',
    location: 'Bengaluru',
    employmentType: 'Full-time',
    description:
      'Build responsive web interfaces, collaborate with designers, and improve user experience across hiring workflows.',
    requiredSkills: ['React', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS'],
  },
  {
    title: 'Backend Developer',
    department: 'Engineering',
    location: 'Pune',
    employmentType: 'Full-time',
    description:
      'Develop scalable APIs, manage data flows, and maintain backend services for recruitment operations.',
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'JavaScript'],
  },
  {
    title: 'Full Stack Developer',
    department: 'Engineering',
    location: 'Hyderabad',
    employmentType: 'Full-time',
    description:
      'Own end-to-end feature delivery across frontend and backend systems used by HR teams.',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'Express', 'Git'],
  },
  {
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Mumbai',
    employmentType: 'Full-time',
    description:
      'Design intuitive product flows, wireframes, and high-fidelity interfaces for recruitment tools.',
    requiredSkills: ['Figma', 'Wireframing', 'Prototyping', 'Design Systems', 'User Research'],
  },
  {
    title: 'QA Engineer',
    department: 'Engineering',
    location: 'Chennai',
    employmentType: 'Full-time',
    description:
      'Plan and execute test cases, identify bugs, and improve product quality before release.',
    requiredSkills: ['Manual Testing', 'API Testing', 'Selenium', 'Bug Tracking', 'Test Cases'],
  },
  {
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    location: 'Bengaluru',
    employmentType: 'Full-time',
    description:
      'Automate deployment pipelines, improve infrastructure reliability, and monitor production systems.',
    requiredSkills: ['AWS', 'Docker', 'CI/CD', 'Linux', 'Kubernetes'],
  },
  {
    title: 'Data Analyst',
    department: 'Analytics',
    location: 'Delhi',
    employmentType: 'Full-time',
    description:
      'Analyze hiring data, create reports, and provide insights to improve recruitment efficiency.',
    requiredSkills: ['SQL', 'Excel', 'Power BI', 'Python', 'Data Visualization'],
  },
  {
    title: 'Machine Learning Engineer',
    department: 'AI',
    location: 'Hyderabad',
    employmentType: 'Full-time',
    description:
      'Build and evaluate ML models that support ranking, matching, and automation use cases.',
    requiredSkills: ['Python', 'Machine Learning', 'Pandas', 'Scikit-learn', 'Model Evaluation'],
  },
  {
    title: 'Recruitment Specialist',
    department: 'Human Resources',
    location: 'Remote',
    employmentType: 'Full-time',
    description:
      'Coordinate candidate pipelines, screen applicants, and partner with hiring managers across teams.',
    requiredSkills: ['Recruitment', 'Candidate Screening', 'Communication', 'Scheduling', 'ATS'],
  },
  {
    title: 'Technical Recruiter',
    department: 'Human Resources',
    location: 'Noida',
    employmentType: 'Full-time',
    description:
      'Source and engage engineering talent while managing technical hiring pipelines end to end.',
    requiredSkills: ['Sourcing', 'Technical Hiring', 'LinkedIn Recruiter', 'Communication', 'Stakeholder Management'],
  },
  {
    title: 'Product Manager',
    department: 'Product',
    location: 'Mumbai',
    employmentType: 'Full-time',
    description:
      'Define roadmap priorities, align teams, and deliver product improvements for recruiters and candidates.',
    requiredSkills: ['Product Strategy', 'Roadmapping', 'User Stories', 'Analytics', 'Stakeholder Management'],
  },
  {
    title: 'Business Analyst',
    department: 'Operations',
    location: 'Kolkata',
    employmentType: 'Full-time',
    description:
      'Translate business requirements into actionable product and process improvements for recruitment workflows.',
    requiredSkills: ['Requirements Gathering', 'Documentation', 'SQL', 'Process Mapping', 'Communication'],
  },
  {
    title: 'Content Writer',
    department: 'Marketing',
    location: 'Remote',
    employmentType: 'Contract',
    description:
      'Create clear, engaging content for employer branding, product communication, and hiring campaigns.',
    requiredSkills: ['Content Writing', 'SEO', 'Copywriting', 'Research', 'Editing'],
  },
  {
    title: 'Customer Success Executive',
    department: 'Customer Success',
    location: 'Pune',
    employmentType: 'Full-time',
    description:
      'Support clients using SmartHire, resolve product issues, and drive long-term platform adoption.',
    requiredSkills: ['Customer Support', 'Communication', 'Problem Solving', 'CRM', 'Onboarding'],
  },
  {
    title: 'HR Operations Associate',
    department: 'Human Resources',
    location: 'Jaipur',
    employmentType: 'Full-time',
    description:
      'Handle day-to-day HR operations, maintain records, and support smooth hiring coordination.',
    requiredSkills: ['HR Operations', 'Documentation', 'Coordination', 'MS Excel', 'Attention to Detail'],
  },
];

const seedJobs = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured.');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const hrUser = await User.findOne({ role: 'hr' }).select('_id');

    if (!hrUser) {
      throw new Error('No HR user found. Create an HR user before seeding jobs.');
    }

    const existingJobs = await Job.find(
      { title: { $in: sampleJobs.map((job) => job.title) } },
      'title',
    ).lean();

    const existingTitles = new Set(existingJobs.map((job) => job.title));

    const jobsToInsert = sampleJobs
      .filter((job) => !existingTitles.has(job.title))
      .map((job) => ({
        ...job,
        createdBy: hrUser._id,
      }));

    if (jobsToInsert.length > 0) {
      await Job.insertMany(jobsToInsert);
    }

    console.log('Jobs seeded successfully');
    console.log(`Inserted: ${jobsToInsert.length}`);
    console.log(`Skipped duplicates: ${sampleJobs.length - jobsToInsert.length}`);
  } catch (error) {
    console.error('Job seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedJobs();
