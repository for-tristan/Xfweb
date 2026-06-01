import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = 'x-foundry-salt';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

async function main() {
  // =============================================
  // Create admin user
  // =============================================
  const adminPassword = await hashPassword('admin123');
  await prisma.user.upsert({
    where: { email: 'admin@xfoundry.com' },
    update: {},
    create: {
      email: 'admin@xfoundry.com',
      name: 'Admin',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log('Admin user created/verified: admin@xfoundry.com');

  // =============================================
  // Seed Services & ServiceFeatures
  // =============================================
  console.log('Seeding services...');

  // --- 1. Web Development ---
  const webDevService = await prisma.service.upsert({
    where: { slug: 'web-development' },
    update: {},
    create: {
      title: 'Web Development',
      slug: 'web-development',
      icon: 'fas fa-globe',
      description:
        'Build modern, responsive web applications with cutting-edge technologies. From single-page applications to full-stack platforms, we deliver scalable solutions that drive results.',
      status: 'active',
      displayOrder: 0,
    },
  });

  const webDevFeatures = [
    {
      title: 'Custom Web Applications',
      description:
        'Tailored web apps built with React, Next.js, and TypeScript for optimal performance and user experience.',
      displayOrder: 0,
    },
    {
      title: 'Responsive Design',
      description:
        'Pixel-perfect interfaces that work flawlessly across all devices and screen sizes.',
      displayOrder: 1,
    },
    {
      title: 'API Development',
      description:
        'Robust RESTful and GraphQL APIs that power your applications with clean architecture.',
      displayOrder: 2,
    },
    {
      title: 'E-Commerce Solutions',
      description:
        'Full-featured online stores with secure payments, inventory management, and analytics.',
      displayOrder: 3,
    },
    {
      title: 'Progressive Web Apps',
      description:
        'Fast, reliable, and engaging web experiences that work offline and feel native.',
      displayOrder: 4,
    },
    {
      title: 'Performance Optimization',
      description:
        'Speed optimization, caching strategies, and Core Web Vitals improvement.',
      displayOrder: 5,
    },
  ];

  for (const feature of webDevFeatures) {
    await prisma.serviceFeature.upsert({
      where: {
        id: `${webDevService.id}-${feature.displayOrder}`,
      },
      update: {},
      create: {
        id: `${webDevService.id}-${feature.displayOrder}`,
        title: feature.title,
        description: feature.description,
        icon: '',
        displayOrder: feature.displayOrder,
        serviceId: webDevService.id,
      },
    });
  }
  console.log(`Service created: ${webDevService.title}`);

  // --- 2. Custom Software Development ---
  const softwareDevService = await prisma.service.upsert({
    where: { slug: 'software-dev' },
    update: {},
    create: {
      title: 'Custom Software Development',
      slug: 'software-dev',
      icon: 'fas fa-code',
      description:
        'End-to-end software development services tailored to your business needs. We transform ideas into production-ready applications.',
      status: 'active',
      displayOrder: 1,
    },
  });

  const softwareDevFeatures = [
    {
      title: 'Full-Stack Development',
      description:
        'Complete development from frontend to backend using modern tech stacks.',
      displayOrder: 0,
    },
    {
      title: 'Database Design',
      description:
        'Scalable database architectures with optimized queries and data modeling.',
      displayOrder: 1,
    },
    {
      title: 'Cloud Deployment',
      description:
        'AWS, GCP, and Azure deployment with CI/CD pipelines and auto-scaling.',
      displayOrder: 2,
    },
    {
      title: 'DevOps & Automation',
      description:
        'Streamlined development workflows with Docker, Kubernetes, and monitoring.',
      displayOrder: 3,
    },
    {
      title: 'System Integration',
      description:
        'Seamless integration with third-party services, APIs, and legacy systems.',
      displayOrder: 4,
    },
    {
      title: 'Technical Consulting',
      description:
        'Expert guidance on architecture decisions, tech stack selection, and scaling strategies.',
      displayOrder: 5,
    },
  ];

  for (const feature of softwareDevFeatures) {
    await prisma.serviceFeature.upsert({
      where: {
        id: `${softwareDevService.id}-${feature.displayOrder}`,
      },
      update: {},
      create: {
        id: `${softwareDevService.id}-${feature.displayOrder}`,
        title: feature.title,
        description: feature.description,
        icon: '',
        displayOrder: feature.displayOrder,
        serviceId: softwareDevService.id,
      },
    });
  }
  console.log(`Service created: ${softwareDevService.title}`);

  // --- 3. Tech Education & Training ---
  const trainingService = await prisma.service.upsert({
    where: { slug: 'training' },
    update: {},
    create: {
      title: 'Tech Education & Training',
      slug: 'training',
      icon: 'fas fa-chalkboard-teacher',
      description:
        'Comprehensive technology education programs designed to transform beginners into skilled professionals. Hands-on learning with real-world projects.',
      status: 'active',
      displayOrder: 2,
    },
  });

  const trainingFeatures = [
    {
      title: 'Structured Curriculum',
      description:
        'Carefully designed learning paths from fundamentals to advanced topics.',
      displayOrder: 0,
    },
    {
      title: 'Hands-On Projects',
      description:
        'Real-world projects that build practical skills and portfolio-worthy work.',
      displayOrder: 1,
    },
    {
      title: 'Expert Instructors',
      description:
        'Learn from industry professionals with years of real-world experience.',
      displayOrder: 2,
    },
    {
      title: 'Flexible Learning',
      description:
        'Self-paced courses with lifetime access to all materials and updates.',
      displayOrder: 3,
    },
    {
      title: 'Community Support',
      description:
        'Join a community of learners for collaboration, Q&A, and networking.',
      displayOrder: 4,
    },
    {
      title: 'Career Guidance',
      description:
        'Resume reviews, interview prep, and job placement assistance.',
      displayOrder: 5,
    },
  ];

  for (const feature of trainingFeatures) {
    await prisma.serviceFeature.upsert({
      where: {
        id: `${trainingService.id}-${feature.displayOrder}`,
      },
      update: {},
      create: {
        id: `${trainingService.id}-${feature.displayOrder}`,
        title: feature.title,
        description: feature.description,
        icon: '',
        displayOrder: feature.displayOrder,
        serviceId: trainingService.id,
      },
    });
  }
  console.log(`Service created: ${trainingService.title}`);

  // =============================================
  // Seed Courses
  // =============================================
  console.log('Seeding courses...');

  // --- 1. Web Development Bootcamp ---
  const webDevCourseFeatures = [
    'HTML, CSS & JavaScript fundamentals',
    'React & Next.js framework mastery',
    'Node.js & Express backend development',
    'Database design with SQL & NoSQL',
    'Authentication & security best practices',
    'Production deployment & DevOps',
    'Responsive design & UX principles',
    'Version control with Git & GitHub',
  ];

  await prisma.course.upsert({
    where: { slug: 'web-dev-bootcamp' },
    update: {},
    create: {
      title: 'Web Development Bootcamp',
      slug: 'web-dev-bootcamp',
      level: 'Beginner to Advanced',
      duration: '12 Weeks',
      price: 'Free',
      icon: 'fas fa-laptop-code',
      description:
        'Master full-stack web development from the ground up. This comprehensive bootcamp takes you from HTML basics to building production-ready applications with React, Next.js, Node.js, and modern databases. Perfect for aspiring developers who want real-world skills.',
      features: JSON.stringify(webDevCourseFeatures),
      prerequisites:
        'No prior programming experience required. A computer with internet access is all you need.',
      techStack:
        'React, Next.js, TypeScript, Node.js, Express, PostgreSQL, Tailwind CSS, Git',
      status: 'active',
      displayOrder: 0,
    },
  });
  console.log('Course created: Web Development Bootcamp');

  // --- 2. Linux Basics & Customization ---
  const linuxCourseFeatures = [
    'Linux file system navigation',
    'Command line mastery & shell scripting',
    'User & permission management',
    'Package management & software installation',
    'System monitoring & process management',
    'Network configuration & troubleshooting',
  ];

  await prisma.course.upsert({
    where: { slug: 'linux-basics' },
    update: {},
    create: {
      title: 'Linux Basics & Customization',
      slug: 'linux-basics',
      level: 'Intermediate',
      duration: '4 Weeks',
      price: 'Free',
      icon: 'fab fa-linux',
      description:
        'Learn Linux from the command line up. Master essential commands, shell scripting, system administration, and customization techniques used by professionals.',
      features: JSON.stringify(linuxCourseFeatures),
      prerequisites:
        'Basic computer literacy. Familiarity with any operating system is helpful.',
      techStack: 'Bash, systemd, apt/pacman, SSH, LVM, iptables',
      status: 'active',
      displayOrder: 1,
    },
  });
  console.log('Course created: Linux Basics & Customization');

  console.log('\n✅ All seed data inserted successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
