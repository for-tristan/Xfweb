#!/usr/bin/env node
/**
 * Turso Database Setup Script
 * 
 * This script:
 * 1. Pushes the Prisma schema to Turso (creates all tables)
 * 2. Seeds the Turso database with initial data (admin user, services, courses, modules)
 * 
 * Usage:
 *   # Set your Turso credentials first:
 *   export DATABASE_URL="libsql://your-db-your-org.turso.io"
 *   export DATABASE_AUTH_TOKEN="your-auth-token"
 *   
 *   # Then run:
 *   node scripts/migrate-to-turso.js
 *   
 *   # Or with local SQLite (for testing):
 *   export DATABASE_URL="file:./db/local.db"
 *   node scripts/migrate-to-turso.js
 */

const { execSync } = require('child_process');
const crypto = require('crypto');

// ─── Configuration ───────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required.');
  console.error('');
  console.error('Usage:');
  console.error('  export DATABASE_URL="libsql://your-db-your-org.turso.io"');
  console.error('  export DATABASE_AUTH_TOKEN="your-auth-token"');
  console.error('  node scripts/migrate-to-turso.js');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════');
console.log('  XFoundry — Turso Database Setup');
console.log('═══════════════════════════════════════════════════');
console.log(`  Database URL: ${DATABASE_URL.replace(/\/\/.*@/, '//***@')}`);
console.log('');

// ─── Step 1: Push Prisma Schema ──────────────────────────────────────────────

console.log('📐 Step 1: Pushing Prisma schema to database...');
try {
  const path = require('path');
  const projectRoot = path.resolve(__dirname, '..');
  execSync('npx prisma db push', {
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL },
  });
  console.log('✅ Schema pushed successfully!\n');
} catch (error) {
  console.error('❌ Failed to push schema. Error:', error.message);
  console.error('   Trying to continue anyway...\n');
}

// ─── Step 2: Seed Data ──────────────────────────────────────────────────────

console.log('🌱 Step 2: Seeding database with initial data...');

// We use @libsql/client directly for raw SQL inserts since Prisma Client
// might not be generated for the new DB yet.
let client;
try {
  const { createClient } = require('@libsql/client');
  client = createClient({
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN,
  });
} catch (error) {
  console.error('❌ Failed to create libsql client:', error.message);
  process.exit(1);
}

function generateId() {
  return 'cl' + crypto.randomBytes(14).toString('hex');
}

function hashPassword(password) {
  const salt = 'x-foundry-salt';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

async function upsertRow(table, data) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map(() => '?').join(', ');
  const sql = `INSERT OR IGNORE INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
  try {
    await client.execute({ sql, args: values });
    return true;
  } catch (error) {
    console.error(`  ⚠️  Failed to insert into ${table}:`, error.message);
    return false;
  }
}

async function countRows(table) {
  const result = await client.execute(`SELECT COUNT(*) as cnt FROM "${table}"`);
  return Number(result.rows[0].cnt);
}

async function seed() {
  // ── Admin User ─────────────────────────────────────────────────────────
  const adminId = generateId();
  const adminPassword = hashPassword('admin123');
  
  console.log('  Creating admin user...');
  await upsertRow('User', {
    id: adminId,
    name: 'Admin',
    email: 'admin@xfoundry.com',
    password: adminPassword,
    role: 'admin',
    username: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // ── Services ───────────────────────────────────────────────────────────
  console.log('  Creating services...');
  
  const services = [
    {
      id: generateId(),
      title: 'Web Development',
      slug: 'web-development',
      icon: 'fas fa-globe',
      description: 'Build modern, responsive web applications with cutting-edge technologies. From single-page applications to full-stack platforms, we deliver scalable solutions that drive results.',
      status: 'active',
      displayOrder: 0,
    },
    {
      id: generateId(),
      title: 'Custom Software Development',
      slug: 'software-dev',
      icon: 'fas fa-code',
      description: 'End-to-end software development services tailored to your business needs. We transform ideas into production-ready applications.',
      status: 'active',
      displayOrder: 1,
    },
    {
      id: generateId(),
      title: 'Tech Education & Training',
      slug: 'training',
      icon: 'fas fa-chalkboard-teacher',
      description: 'Comprehensive technology education programs designed to transform beginners into skilled professionals. Hands-on learning with real-world projects.',
      status: 'active',
      displayOrder: 2,
    },
  ];

  const serviceFeatures = [
    // Web Development features
    [
      { title: 'Custom Web Applications', description: 'Tailored web apps built with React, Next.js, and TypeScript for optimal performance and user experience.' },
      { title: 'Responsive Design', description: 'Pixel-perfect interfaces that work flawlessly across all devices and screen sizes.' },
      { title: 'API Development', description: 'Robust RESTful and GraphQL APIs that power your applications with clean architecture.' },
      { title: 'E-Commerce Solutions', description: 'Full-featured online stores with secure payments, inventory management, and analytics.' },
      { title: 'Progressive Web Apps', description: 'Fast, reliable, and engaging web experiences that work offline and feel native.' },
      { title: 'Performance Optimization', description: 'Speed optimization, caching strategies, and Core Web Vitals improvement.' },
    ],
    // Custom Software features
    [
      { title: 'Full-Stack Development', description: 'Complete development from frontend to backend using modern tech stacks.' },
      { title: 'Database Design', description: 'Scalable database architectures with optimized queries and data modeling.' },
      { title: 'Cloud Deployment', description: 'AWS, GCP, and Azure deployment with CI/CD pipelines and auto-scaling.' },
      { title: 'DevOps & Automation', description: 'Streamlined development workflows with Docker, Kubernetes, and monitoring.' },
      { title: 'System Integration', description: 'Seamless integration with third-party services, APIs, and legacy systems.' },
      { title: 'Technical Consulting', description: 'Expert guidance on architecture decisions, tech stack selection, and scaling strategies.' },
    ],
    // Training features
    [
      { title: 'Structured Curriculum', description: 'Carefully designed learning paths from fundamentals to advanced topics.' },
      { title: 'Hands-On Projects', description: 'Real-world projects that build practical skills and portfolio-worthy work.' },
      { title: 'Expert Instructors', description: 'Learn from industry professionals with years of real-world experience.' },
      { title: 'Flexible Learning', description: 'Self-paced courses with lifetime access to all materials and updates.' },
      { title: 'Community Support', description: 'Join a community of learners for collaboration, Q&A, and networking.' },
      { title: 'Career Guidance', description: 'Resume reviews, interview prep, and job placement assistance.' },
    ],
  ];

  for (let i = 0; i < services.length; i++) {
    const svc = services[i];
    await upsertRow('Service', {
      ...svc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    for (let j = 0; j < serviceFeatures[i].length; j++) {
      const feat = serviceFeatures[i][j];
      await upsertRow('ServiceFeature', {
        id: `${svc.id}-${j}`,
        title: feat.title,
        description: feat.description,
        icon: '',
        displayOrder: j,
        serviceId: svc.id,
      });
    }
  }

  // ── Courses ────────────────────────────────────────────────────────────
  console.log('  Creating courses...');
  
  const courses = [
    {
      id: generateId(),
      title: 'Web Development Bootcamp',
      slug: 'web-dev-bootcamp',
      level: 'Beginner to Advanced',
      duration: '12 Weeks',
      price: 'Free',
      icon: 'fas fa-laptop-code',
      description: 'Master full-stack web development from the ground up. This comprehensive bootcamp takes you from HTML basics to building production-ready applications with React, Next.js, Node.js, and modern databases.',
      features: JSON.stringify([
        'HTML, CSS & JavaScript fundamentals',
        'React & Next.js framework mastery',
        'Node.js & Express backend development',
        'Database design with SQL & NoSQL',
        'Authentication & security best practices',
        'Production deployment & DevOps',
        'Responsive design & UX principles',
        'Version control with Git & GitHub',
      ]),
      prerequisites: 'No prior programming experience required. A computer with internet access is all you need.',
      techStack: 'React, Next.js, TypeScript, Node.js, Express, PostgreSQL, Tailwind CSS, Git',
      status: 'active',
      displayOrder: 0,
    },
    {
      id: generateId(),
      title: 'Linux Basics & Customization',
      slug: 'linux-basics',
      level: 'Intermediate',
      duration: '4 Weeks',
      price: 'Free',
      icon: 'fab fa-linux',
      description: 'Learn Linux from the command line up. Master essential commands, shell scripting, system administration, and customization techniques used by professionals.',
      features: JSON.stringify([
        'Linux file system navigation',
        'Command line mastery & shell scripting',
        'User & permission management',
        'Package management & software installation',
        'System monitoring & process management',
        'Network configuration & troubleshooting',
      ]),
      prerequisites: 'Basic computer literacy. Familiarity with any operating system is helpful.',
      techStack: 'Bash, systemd, apt/pacman, SSH, LVM, iptables',
      status: 'active',
      displayOrder: 1,
    },
  ];

  const courseModules = [
    // Web Dev Bootcamp modules (with full content)
    [
      { title: 'HTML & CSS Foundations', description: 'HTML structure, CSS styling, responsive design, Flexbox, Grid, semantic markup', moduleOrder: 1, content: 'HTML (HyperText Markup Language) and CSS (Cascading Style Sheets) are the foundational building blocks of every website on the internet. In this module, you will learn how to structure content with HTML and style it beautifully with CSS, creating the visual foundation for all web applications.\n\nWe begin with HTML fundamentals — the structure of an HTML document, DOCTYPE declarations, and the box model that underpins every element. You will learn semantic HTML5 elements and why using them correctly matters for accessibility and SEO. We cover headings, paragraphs, lists, links, images, forms, tables, and multimedia elements in depth.\n\nCSS is where design comes to life. You will master selectors, the cascade and specificity rules, and the box model. We explore CSS custom properties (variables) that make themes and design systems possible.\n\nResponsive design is essential. You will learn mobile-first design principles, media queries, fluid typography with clamp(), and viewport units. We dedicate significant time to CSS Flexbox for one-dimensional layouts and CSS Grid for two-dimensional layouts.\n\nBy the end of this module, you will be able to take a design mockup and convert it into a pixel-perfect, responsive web page using semantic HTML and modern CSS techniques.' },
      { title: 'JavaScript Essentials', description: 'Variables, functions, DOM manipulation, events, async programming, ES6+ features', moduleOrder: 2, content: 'JavaScript is the programming language of the web, and mastering it is essential for building interactive, dynamic applications. This module takes you from JavaScript basics to advanced concepts that professional developers use daily.\n\nWe start with the fundamentals: variable declarations (let, const), data types, operators, and control flow. You will understand type coercion, strict equality (===), and the quirks that make JavaScript both powerful and surprising.\n\nFunctions are the backbone of JavaScript. We cover function declarations, expressions, arrow functions, default parameters, rest and spread operators, and closures. You will understand scope, hoisting, and the execution context.\n\nDOM manipulation is how JavaScript interacts with web pages. You will learn to select elements, modify content and attributes, create and remove elements, and work with CSS classes. We cover event handling, event delegation, and preventing default behaviors.\n\nAsynchronous JavaScript is critical for modern web development. We cover callbacks, Promises, async/await, the event loop, and error handling with try/catch. You will learn to make HTTP requests with the Fetch API.\n\nBy the end of this module, you will build an interactive task manager application using DOM manipulation, event handling, localStorage, and async operations.' },
      { title: 'React & Next.js', description: 'Components, hooks, state management, server-side rendering, routing, data fetching', moduleOrder: 3, content: 'React has revolutionized how we build user interfaces, and Next.js extends React with server-side rendering, routing, and production optimizations. This module teaches you both frameworks from the ground up.\n\nWe begin with React fundamentals: JSX syntax, component composition, props, and the virtual DOM. We cover functional components exclusively.\n\nReact Hooks are the modern way to manage state and side effects. You will master useState, useEffect, useContext, useReducer, useMemo, useCallback, and useRef. We also cover custom hooks — how to extract reusable logic into composable functions.\n\nNext.js provides the full-stack framework layer on top of React. You will learn file-based routing, server components vs client components, server actions, layout patterns, and metadata management for SEO. We cover data fetching strategies: SSG, SSR, ISR, and client-side fetching.\n\nState management in larger applications requires patterns beyond useState. We cover the Context API, Zustand, and patterns for managing complex application state.\n\nBy the end of this module, you will build a full-featured blog platform with dynamic routing, server-side rendering, and optimized data fetching using Next.js App Router patterns.' },
      { title: 'Backend with Node.js', description: 'Express, REST APIs, authentication, middleware, WebSockets, file uploads', moduleOrder: 4, content: 'Node.js enables JavaScript to run on the server, making it possible to build complete web applications using a single language throughout the stack. This module covers backend development with Node.js and Express.\n\nWe start with Node.js fundamentals: the event loop, non-blocking I/O, the module system, and built-in modules. You will understand why Node.js excels at I/O-heavy applications.\n\nExpress.js is the most popular Node.js web framework. You will learn to create RESTful APIs with routing, middleware, request/response handling, and error management. We cover HTTP methods, status codes, request validation, and API design best practices.\n\nAuthentication and authorization are critical. We implement JWT authentication from scratch, covering token generation, verification, refresh tokens, and secure cookie-based storage. You will implement role-based access control (RBAC).\n\nDatabase integration connects your API to persistent storage. We cover connecting to PostgreSQL, connection pooling, transactions, and migrations. You will also learn to work with Prisma ORM for type-safe database access.\n\nBy the end of this module, you will build a complete REST API with user authentication, CRUD operations, file upload handling, input validation, and comprehensive error handling.' },
      { title: 'Database Design', description: 'SQL, NoSQL, schema design, queries, migrations, ORMs, data modeling', moduleOrder: 5, content: 'Every non-trivial application needs a database, and choosing the right one along with designing an effective schema is a skill that separates junior developers from senior engineers. This module covers database theory, SQL, NoSQL, and practical data modeling.\n\nWe begin with relational database fundamentals: tables, rows, columns, primary keys, foreign keys, and relationships. You will learn normalization and when to denormalize for performance. PostgreSQL is our primary SQL database, and you will master SELECT queries with JOINs, subqueries, CTEs, window functions, and aggregate functions.\n\nIndexing is crucial for performance. You will understand B-tree indexes, covering indexes, partial indexes, and how to read query execution plans. We cover the N+1 query problem and how to solve it.\n\nNoSQL databases serve different use cases. We explore MongoDB for document storage, Redis for caching and sessions, and discuss when each is appropriate. You will understand CAP theorem and the trade-offs between SQL and NoSQL.\n\nDatabase migrations manage schema changes safely in production. We use Prisma Migrate for version-controlled schema evolution. You will also learn about connection pooling, database backups, and monitoring.\n\nBy the end of this module, you will design and implement a complete database schema for a real-world application, write optimized queries, and set up migrations.' },
      { title: 'Deployment & DevOps', description: 'Cloud deployment, CI/CD, Docker, monitoring, SSL, domain setup, performance', moduleOrder: 6, content: 'Building a great application is only half the battle — deploying it reliably and keeping it running smoothly is equally important. This module covers deployment strategies, DevOps practices, and production readiness.\n\nWe start with cloud platforms: deploying Next.js applications to Vercel, traditional VPS hosting, and containerized deployment with Docker on AWS/GCP. You will understand the trade-offs between managed platforms and self-hosted solutions.\n\nDocker containerizes your application for consistent environments across development, staging, and production. You will learn to write Dockerfiles, use multi-stage builds, compose multi-container applications with Docker Compose, and manage container orchestration basics.\n\nCI/CD automates your development workflow. We set up GitHub Actions for running tests, linting, building, and deploying on every push. You will learn branch protection rules, preview deployments, and rollback strategies.\n\nDomain and SSL configuration connects your application to the internet. We cover DNS records, domain registration, SSL/TLS certificates with Let\'s Encrypt and Cloudflare, and HTTPS best practices.\n\nMonitoring and observability ensure you know when things go wrong. We cover structured logging, error tracking, performance monitoring, uptime monitoring, and alerting.\n\nBy the end of this module, you will deploy a complete full-stack application to production with CI/CD, custom domain, HTTPS, monitoring, and automated backups.' },
    ],
    // Linux Basics modules (with content)
    [
      { title: 'Linux Fundamentals', description: 'History of Unix/Linux, distro landscape, installation basics, file system navigation', moduleOrder: 1, content: 'Linux is the backbone of modern computing — from servers and smartphones to supercomputers and embedded devices. Understanding Linux is essential for any serious technology professional.\n\nWe begin with the history of Unix and Linux, including the Unix philosophy (modularity, simplicity, composability), how Richard Stallman started the GNU Project in 1983, and how Linus Torvalds created the Linux kernel in 1991.\n\nThe Linux distribution landscape can be overwhelming for newcomers. We provide a clear taxonomy: Debian-based (Ubuntu, Debian, Linux Mint), Red Hat-based (Fedora, RHEL, CentOS), Arch-based (Arch Linux, Manjaro), and independent distributions. We discuss the philosophies behind each family and help you choose the right distro.\n\nInstallation basics cover dual-booting alongside Windows, using a virtual machine, and WSL2. We walk through creating a bootable USB drive, partitioning concepts, and the basic installation process.\n\nThe Linux file system hierarchy is fundamentally different from Windows. We explore the root directory structure: /bin, /etc, /home, /var, /tmp, /usr, /dev, /proc, and /sys. Understanding this hierarchy is crucial for navigating and administering a Linux system.\n\nBy the end of this module, you will have Linux installed, understand the file system, and be comfortable navigating the command line.' },
      { title: 'Command Line Mastery', description: 'Shell scripting, grep, sed, awk, pipes, redirection, process management', moduleOrder: 2, content: 'The command line is the most powerful interface to a Linux system. This module transforms you from a casual user into a command line power user.\n\nWe start with essential commands for file operations: ls, cd, pwd, cp, mv, rm, mkdir, rmdir, touch, and find. You will learn wildcards (glob patterns), brace expansion, and command substitution.\n\nText processing tools are the Swiss Army knife of Linux. We cover cat, less, head, tail, grep (with regex), sed, awk, sort, uniq, wc, cut, and tr. You will chain these tools together using pipes and redirection to perform complex data transformations in a single line.\n\nShell scripting automates repetitive tasks. You will write Bash scripts with variables, conditionals (if/elif/else), loops (for, while), functions, command-line arguments, and exit codes. We cover debugging techniques, best practices, and real-world scripting patterns.\n\nProcess management keeps your system running smoothly. You will learn ps, top, htop, kill, bg, fg, jobs, nohup, and systemctl. We cover process signals, daemon management, and how to troubleshoot unresponsive processes.\n\nBy the end of this module, you will write complex shell scripts, process text data efficiently, and manage processes like a professional system administrator.' },
      { title: 'User & Permission Management', description: 'Users, groups, chmod, chown, sudo, ACLs, security hardening', moduleOrder: 3, content: 'Linux is a multi-user operating system, and proper user and permission management is critical for security. This module teaches you how to control access to your system.\n\nWe cover user management: useradd, usermod, userdel, passwd, and the /etc/passwd and /etc/shadow files. You will understand the difference between system users and regular users, and how to create users with specific home directories, shells, and group memberships.\n\nGroup management simplifies access control: groupadd, groupmod, groupdel, gpasswd, and the /etc/group file. You will learn about primary vs supplementary groups and how groups enable collaborative access to shared resources.\n\nFile permissions control who can read, write, and execute files. We cover the traditional rwx model (chmod in symbolic and octal notation), ownership changes (chown, chgrp), and special permissions (setuid, setgid, sticky bit).\n\nAccess Control Lists (ACLs) provide fine-grained permission management beyond the traditional owner/group/others model. You will use getfacl and setfacl to configure per-user and per-group permissions.\n\nSecurity hardening includes configuring sudo (visudo), disabling root login, setting up SSH key authentication, implementing fail2ban, and following CIS benchmarks for system hardening.\n\nBy the end of this module, you will manage users and permissions confidently and implement security best practices to protect your Linux systems.' },
      { title: 'Package Management & Customization', description: 'apt/pacman/dnf, AUR, building from source, dotfiles, window managers, theming', moduleOrder: 4, content: 'Package management is how you install, update, and remove software on Linux. This module covers the major package managers and then dives into system customization.\n\nWe cover the three major package management families: APT (Debian/Ubuntu), DNF/YUM (Fedora/RHEL), and Pacman (Arch Linux). You will learn to search for packages, install them, update your system, handle dependencies, and manage repositories.\n\nThe Arch User Repository (AUR) is one of the largest software repositories in the Linux ecosystem. You will learn to use AUR helpers (yay, paru), read PKGBUILD files, and build packages from source safely.\n\nBuilding from source is sometimes necessary when packages are not available in repositories. We cover downloading source tarballs, reading README/INSTALL files, running ./configure && make && make install, and managing custom-built packages.\n\nSystem customization (ricing) is where Linux truly shines. We cover shell customization (Oh My Zsh, Starship prompt), terminal emulators (Alacritty, Kitty, WezTerm), text editors (Neovim, VS Code), window managers (i3, Sway, Hyprland), and theming (GTK/QT themes, icon packs, fonts).\n\nDotfile management keeps your customizations portable. You will learn to version-control your dotfiles with Git, use GNU Stow or Chezmoi for management, and create automated setup scripts.\n\nBy the end of this module, you will have a fully customized Linux environment tailored to your workflow and aesthetic preferences.' },
    ],
  ];

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    await upsertRow('Course', {
      ...course,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    for (const mod of courseModules[i]) {
      await upsertRow('CourseModule', {
        id: generateId(),
        courseId: course.id,
        title: mod.title,
        description: mod.description,
        content: mod.content || '',
        moduleOrder: mod.moduleOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // ── Verify ─────────────────────────────────────────────────────────────
  console.log('');
  console.log('📊 Database Summary:');
  const tables = [
    'User', 'Course', 'CourseModule', 'Service', 'ServiceFeature',
    'Enrollment', 'TeamMember', 'Project', 'SiteSetting',
    'ModuleTest', 'TestQuestion', 'TestAttempt',
  ];
  
  for (const table of tables) {
    try {
      const count = await countRows(table);
      if (count > 0) console.log(`  ✅ ${table}: ${count} rows`);
    } catch (e) {
      // Table might not exist yet, skip
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ Setup Complete!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('  Admin login: admin@xfoundry.com / admin123');
  console.log('  (Change the password after first login!)');
  console.log('');

  await client.close();
}

seed().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
