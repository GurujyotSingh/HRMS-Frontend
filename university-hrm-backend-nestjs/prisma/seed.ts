import { PrismaClient, SystemRole, Gender, EmploymentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. System Settings
  await prisma.systemSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      workStartTime: '09:00',
      workEndTime: '17:00',
      lateThresholdMinutes: 15,
      workingDays: [1, 2, 3, 4, 5],
      leaveCarryForwardMax: 5,
      payrollCycleDay: 1,
      aiEnabled: true,
      aiSystemPrompt: 'You are an HR assistant for a University HRMS. Help employees with leave policies, payroll questions, onboarding, and general HR guidance. Be professional, friendly, and concise.',
    },
    update: {},
  });

  // 2. Departments
  const departments = [
    { name: 'Computer Science', code: 'CS' },
    { name: 'Electrical Engineering', code: 'EE' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Administration', code: 'ADMIN' },
  ];

  const deptRecords: Record<string, string> = {};
  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { code: dept.code },
      create: dept,
      update: {},
    });
    deptRecords[dept.code] = created.id;
  }

  // 3. Users
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@university.edu' },
    create: {
      employeeId: 'EMP-2026-0001',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'super@university.edu',
      workEmail: 'super@university.edu',
      passwordHash,
      phone: '+91-9876543210',
      role: SystemRole.SUPER_ADMIN,
      designation: 'System Administrator',
      departmentId: deptRecords['ADMIN'],
      employmentType: EmploymentType.FULL_TIME,
      salary: 120000,
      joinDate: new Date('2020-01-15'),
      gender: Gender.MALE,
      status: 'ACTIVE',
    },
    update: {},
  });

  // HR Manager
  const hrManager = await prisma.user.upsert({
    where: { email: 'hr.manager@university.edu' },
    create: {
      employeeId: 'EMP-2026-0002',
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'hr.manager@university.edu',
      workEmail: 'hr.manager@university.edu',
      passwordHash,
      phone: '+91-9876543211',
      role: SystemRole.HR_MANAGER,
      designation: 'HR Manager',
      departmentId: deptRecords['HR'],
      employmentType: EmploymentType.FULL_TIME,
      salary: 85000,
      joinDate: new Date('2021-03-01'),
      gender: Gender.FEMALE,
      status: 'ACTIVE',
    },
    update: {},
  });

  // HR Staff
  const hrStaff = await prisma.user.upsert({
    where: { email: 'hr.staff@university.edu' },
    create: {
      employeeId: 'EMP-2026-0003',
      firstName: 'Amit',
      lastName: 'Patel',
      email: 'hr.staff@university.edu',
      workEmail: 'hr.staff@university.edu',
      passwordHash,
      phone: '+91-9876543212',
      role: SystemRole.HR_STAFF,
      designation: 'HR Executive',
      departmentId: deptRecords['HR'],
      employmentType: EmploymentType.FULL_TIME,
      salary: 55000,
      joinDate: new Date('2022-06-15'),
      gender: Gender.MALE,
      status: 'ACTIVE',
      reportingManagerId: hrManager.id,
    },
    update: {},
  });

  // Director (CS)
  const directorCS = await prisma.user.upsert({
    where: { email: 'director.cs@university.edu' },
    create: {
      employeeId: 'EMP-2026-0004',
      firstName: 'Dr. Rajesh',
      lastName: 'Kumar',
      email: 'director.cs@university.edu',
      workEmail: 'director.cs@university.edu',
      passwordHash,
      phone: '+91-9876543213',
      role: SystemRole.DIRECTOR,
      designation: 'Director of Computer Science',
      departmentId: deptRecords['CS'],
      employmentType: EmploymentType.FULL_TIME,
      salary: 100000,
      joinDate: new Date('2019-08-01'),
      gender: Gender.MALE,
      status: 'ACTIVE',
    },
    update: {},
  });

  // Assign director to department
  await prisma.department.update({
    where: { id: deptRecords['CS'] },
    data: { directorId: directorCS.id },
  });

  // Faculty
  const faculty1 = await prisma.user.upsert({
    where: { email: 'faculty1@university.edu' },
    create: {
      employeeId: 'EMP-2026-0005',
      firstName: 'Dr. Anjali',
      lastName: 'Verma',
      email: 'faculty1@university.edu',
      workEmail: 'faculty1@university.edu',
      passwordHash,
      phone: '+91-9876543214',
      role: SystemRole.FACULTY,
      designation: 'Associate Professor',
      departmentId: deptRecords['CS'],
      employmentType: EmploymentType.FULL_TIME,
      salary: 75000,
      joinDate: new Date('2021-07-01'),
      gender: Gender.FEMALE,
      status: 'ACTIVE',
      reportingManagerId: directorCS.id,
    },
    update: {},
  });

  // Staff
  const staff1 = await prisma.user.upsert({
    where: { email: 'staff1@university.edu' },
    create: {
      employeeId: 'EMP-2026-0006',
      firstName: 'Rahul',
      lastName: 'Singh',
      email: 'staff1@university.edu',
      workEmail: 'staff1@university.edu',
      passwordHash,
      phone: '+91-9876543215',
      role: SystemRole.STAFF,
      designation: 'Lab Technician',
      departmentId: deptRecords['CS'],
      employmentType: EmploymentType.FULL_TIME,
      salary: 35000,
      joinDate: new Date('2023-01-10'),
      gender: Gender.MALE,
      status: 'ACTIVE',
      reportingManagerId: directorCS.id,
    },
    update: {},
  });

  // 4. Leave Balances for current year
  const year = new Date().getFullYear();
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  for (const u of allUsers) {
    await prisma.leaveBalance.upsert({
      where: { employeeId_year: { employeeId: u.id, year } },
      create: { employeeId: u.id, year },
      update: {},
    });
  }

  // 5. Holidays (2026)
  const holidays = [
    { name: 'Republic Day', date: '2026-01-26', type: 'NATIONAL' as const },
    { name: 'Holi', date: '2026-03-17', type: 'NATIONAL' as const },
    { name: 'Independence Day', date: '2026-08-15', type: 'NATIONAL' as const },
    { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'NATIONAL' as const },
    { name: 'Diwali', date: '2026-11-08', type: 'NATIONAL' as const },
    { name: 'Christmas', date: '2026-12-25', type: 'NATIONAL' as const },
    { name: 'University Foundation Day', date: '2026-04-15', type: 'UNIVERSITY' as const },
  ];

  for (const h of holidays) {
    await prisma.holiday.create({
      data: { name: h.name, date: new Date(h.date), type: h.type },
    }).catch(() => {}); // Skip if already exists
  }

  // 6. Sample Announcements
  await prisma.announcement.create({
    data: {
      title: 'Welcome to the new University HRMS!',
      body: 'We are excited to announce the launch of our new HRMS platform. All employees can now manage their profiles, apply for leaves, and track attendance online.',
      authorId: superAdmin.id,
      targetRoles: [],
      priority: 'IMPORTANT',
    },
  }).catch(() => {});

  await prisma.announcement.create({
    data: {
      title: 'Annual Performance Review Cycle 2026',
      body: 'The annual performance review cycle starts on June 1st. Please ensure your goals are updated and discuss with your reporting manager.',
      authorId: hrManager.id,
      targetRoles: [SystemRole.FACULTY, SystemRole.STAFF],
      priority: 'NORMAL',
    },
  }).catch(() => {});

  console.log('✅ Seed completed!');
  console.log(`
  📋 Test Accounts (all passwords: Admin@123):
  ─────────────────────────────────────────────
  Super Admin:  super@university.edu
  HR Manager:   hr.manager@university.edu
  HR Staff:     hr.staff@university.edu
  Director:     director.cs@university.edu
  Faculty:      faculty1@university.edu
  Staff:        staff1@university.edu
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
