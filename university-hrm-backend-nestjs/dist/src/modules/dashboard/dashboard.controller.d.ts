import { DashboardService } from './dashboard.service';
import { SystemRole } from '@prisma/client';
export declare class DashboardController {
    private svc;
    constructor(svc: DashboardService);
    getDashboard(user: {
        sub: string;
        role: SystemRole;
        departmentId: string | null;
    }): Promise<{
        stats: {
            totalEmployees: number;
            activeEmployees: number;
            onLeaveToday: number;
            pendingLeaves: number;
            departmentCount: number;
            totalPayrollThisMonth: number;
            todayPresent: number;
            todayAbsent: number;
        };
        recentHires: {
            id: string;
            department: {
                name: string;
            } | null;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
            joinDate: Date | null;
        }[];
        departments: {
            id: string;
            name: string;
            code: string;
            headCount: number;
        }[];
        leaveTrend: {
            month: string;
            year: number;
            count: number;
        }[];
    } | {
        stats: {
            teamSize: number;
            onLeave: number;
            pending: number;
            todayPresent: number;
        };
        team: {
            id: string;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
            role: import(".prisma/client").$Enums.SystemRole;
            designation: string | null;
        }[];
    } | {
        leaveBalance: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            employeeId: string;
            year: number;
            annualTotal: number;
            annualUsed: number;
            sickTotal: number;
            sickUsed: number;
            casualTotal: number;
            casualUsed: number;
            maternityTotal: number;
            maternityUsed: number;
            paternityTotal: number;
            paternityUsed: number;
            unpaidUsed: number;
            compensatoryTotal: number;
            compensatoryUsed: number;
        } | null;
        pendingLeaves: number;
        recentAttendance: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            employeeId: string;
            status: import(".prisma/client").$Enums.AttendanceStatus;
            date: Date;
            checkIn: Date | null;
            checkOut: Date | null;
            totalHours: number | null;
            isLate: boolean;
            notes: string | null;
            correctedBy: string | null;
            correctedAt: Date | null;
        }[];
        unreadNotifications: number;
        onboarding: ({
            tasks: {
                id: string;
                updatedAt: Date;
                createdAt: Date;
                status: import(".prisma/client").$Enums.TaskStatus;
                title: string;
                priority: import(".prisma/client").$Enums.TaskPriority;
                description: string | null;
                completedAt: Date | null;
                dueDate: Date;
                order: number;
                onboardingId: string;
                assignedToId: string;
            }[];
        } & {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            employeeId: string;
            status: import(".prisma/client").$Enums.OnboardingStatus;
            startDate: Date;
            expectedCompletionDate: Date;
            completedAt: Date | null;
        }) | null;
    }>;
    getAdmin(): Promise<{
        stats: {
            totalEmployees: number;
            activeEmployees: number;
            onLeaveToday: number;
            pendingLeaves: number;
            departmentCount: number;
            totalPayrollThisMonth: number;
            todayPresent: number;
            todayAbsent: number;
        };
        recentHires: {
            id: string;
            department: {
                name: string;
            } | null;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
            joinDate: Date | null;
        }[];
        departments: {
            id: string;
            name: string;
            code: string;
            headCount: number;
        }[];
        leaveTrend: {
            month: string;
            year: number;
            count: number;
        }[];
    }>;
    getDirector(deptId: string): Promise<{
        stats: {
            teamSize: number;
            onLeave: number;
            pending: number;
            todayPresent: number;
        };
        team: {
            id: string;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
            role: import(".prisma/client").$Enums.SystemRole;
            designation: string | null;
        }[];
    }>;
    getEmployee(userId: string): Promise<{
        leaveBalance: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            employeeId: string;
            year: number;
            annualTotal: number;
            annualUsed: number;
            sickTotal: number;
            sickUsed: number;
            casualTotal: number;
            casualUsed: number;
            maternityTotal: number;
            maternityUsed: number;
            paternityTotal: number;
            paternityUsed: number;
            unpaidUsed: number;
            compensatoryTotal: number;
            compensatoryUsed: number;
        } | null;
        pendingLeaves: number;
        recentAttendance: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            employeeId: string;
            status: import(".prisma/client").$Enums.AttendanceStatus;
            date: Date;
            checkIn: Date | null;
            checkOut: Date | null;
            totalHours: number | null;
            isLate: boolean;
            notes: string | null;
            correctedBy: string | null;
            correctedAt: Date | null;
        }[];
        unreadNotifications: number;
        onboarding: ({
            tasks: {
                id: string;
                updatedAt: Date;
                createdAt: Date;
                status: import(".prisma/client").$Enums.TaskStatus;
                title: string;
                priority: import(".prisma/client").$Enums.TaskPriority;
                description: string | null;
                completedAt: Date | null;
                dueDate: Date;
                order: number;
                onboardingId: string;
                assignedToId: string;
            }[];
        } & {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            employeeId: string;
            status: import(".prisma/client").$Enums.OnboardingStatus;
            startDate: Date;
            expectedCompletionDate: Date;
            completedAt: Date | null;
        }) | null;
    }>;
}
