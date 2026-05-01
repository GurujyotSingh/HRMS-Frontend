"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
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
    const departments = [
        { name: 'Computer Science', code: 'CS' },
        { name: 'Electrical Engineering', code: 'EE' },
        { name: 'Mechanical Engineering', code: 'ME' },
        { name: 'Mathematics', code: 'MATH' },
        { name: 'Physics', code: 'PHY' },
        { name: 'Human Resources', code: 'HR' },
        { name: 'Administration', code: 'ADMIN' },
    ];
    const deptRecords = {};
    for (const dept of departments) {
        const created = await prisma.department.upsert({
            where: { code: dept.code },
            create: dept,
            update: {},
        });
        deptRecords[dept.code] = created.id;
    }
    const passwordHash = await bcrypt.hash('Admin@123', 12);
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
            role: client_1.SystemRole.SUPER_ADMIN,
            designation: 'System Administrator',
            departmentId: deptRecords['ADMIN'],
            employmentType: client_1.EmploymentType.FULL_TIME,
            salary: 120000,
            joinDate: new Date('2020-01-15'),
            gender: client_1.Gender.MALE,
            status: 'ACTIVE',
        },
        update: {},
    });
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
            role: client_1.SystemRole.HR_MANAGER,
            designation: 'HR Manager',
            departmentId: deptRecords['HR'],
            employmentType: client_1.EmploymentType.FULL_TIME,
            salary: 85000,
            joinDate: new Date('2021-03-01'),
            gender: client_1.Gender.FEMALE,
            status: 'ACTIVE',
        },
        update: {},
    });
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
            role: client_1.SystemRole.HR_STAFF,
            designation: 'HR Executive',
            departmentId: deptRecords['HR'],
            employmentType: client_1.EmploymentType.FULL_TIME,
            salary: 55000,
            joinDate: new Date('2022-06-15'),
            gender: client_1.Gender.MALE,
            status: 'ACTIVE',
            reportingManagerId: hrManager.id,
        },
        update: {},
    });
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
            role: client_1.SystemRole.DIRECTOR,
            designation: 'Director of Computer Science',
            departmentId: deptRecords['CS'],
            employmentType: client_1.EmploymentType.FULL_TIME,
            salary: 100000,
            joinDate: new Date('2019-08-01'),
            gender: client_1.Gender.MALE,
            status: 'ACTIVE',
        },
        update: {},
    });
    await prisma.department.update({
        where: { id: deptRecords['CS'] },
        data: { directorId: directorCS.id },
    });
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
            role: client_1.SystemRole.FACULTY,
            designation: 'Associate Professor',
            departmentId: deptRecords['CS'],
            employmentType: client_1.EmploymentType.FULL_TIME,
            salary: 75000,
            joinDate: new Date('2021-07-01'),
            gender: client_1.Gender.FEMALE,
            status: 'ACTIVE',
            reportingManagerId: directorCS.id,
        },
        update: {},
    });
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
            role: client_1.SystemRole.STAFF,
            designation: 'Lab Technician',
            departmentId: deptRecords['CS'],
            employmentType: client_1.EmploymentType.FULL_TIME,
            salary: 35000,
            joinDate: new Date('2023-01-10'),
            gender: client_1.Gender.MALE,
            status: 'ACTIVE',
            reportingManagerId: directorCS.id,
        },
        update: {},
    });
    const year = new Date().getFullYear();
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    for (const u of allUsers) {
        await prisma.leaveBalance.upsert({
            where: { employeeId_year: { employeeId: u.id, year } },
            create: { employeeId: u.id, year },
            update: {},
        });
    }
    const holidays = [
        { name: 'Republic Day', date: '2026-01-26', type: 'NATIONAL' },
        { name: 'Holi', date: '2026-03-17', type: 'NATIONAL' },
        { name: 'Independence Day', date: '2026-08-15', type: 'NATIONAL' },
        { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'NATIONAL' },
        { name: 'Diwali', date: '2026-11-08', type: 'NATIONAL' },
        { name: 'Christmas', date: '2026-12-25', type: 'NATIONAL' },
        { name: 'University Foundation Day', date: '2026-04-15', type: 'UNIVERSITY' },
    ];
    for (const h of holidays) {
        await prisma.holiday.create({
            data: { name: h.name, date: new Date(h.date), type: h.type },
        }).catch(() => { });
    }
    await prisma.announcement.create({
        data: {
            title: 'Welcome to the new University HRMS!',
            body: 'We are excited to announce the launch of our new HRMS platform. All employees can now manage their profiles, apply for leaves, and track attendance online.',
            authorId: superAdmin.id,
            targetRoles: [],
            priority: 'IMPORTANT',
        },
    }).catch(() => { });
    await prisma.announcement.create({
        data: {
            title: 'Annual Performance Review Cycle 2026',
            body: 'The annual performance review cycle starts on June 1st. Please ensure your goals are updated and discuss with your reporting manager.',
            authorId: hrManager.id,
            targetRoles: [client_1.SystemRole.FACULTY, client_1.SystemRole.STAFF],
            priority: 'NORMAL',
        },
    }).catch(() => { });
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
//# sourceMappingURL=seed.js.map