import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole, LeaveType } from '@prisma/client';
export declare class LeaveService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: Record<string, unknown>, currentUser: {
        sub: string;
        role: SystemRole;
        departmentId: string | null;
    }): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
        employee: {
            id: string;
            department: {
                name: string;
            } | null;
            employeeId: string;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
        };
        reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        updatedAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.LeaveStatus;
        reason: string;
        leaveType: import(".prisma/client").$Enums.LeaveType;
        fromDate: Date;
        toDate: Date;
        totalDays: number;
        attachmentUrl: string | null;
        reviewedAt: Date | null;
        remarks: string | null;
        appliedAt: Date;
        reviewedById: string | null;
    }>>;
    apply(userId: string, dto: {
        leaveType: LeaveType;
        fromDate: string;
        toDate: string;
        reason: string;
        attachmentUrl?: string;
    }): Promise<{
        employee: {
            employeeId: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        updatedAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.LeaveStatus;
        reason: string;
        leaveType: import(".prisma/client").$Enums.LeaveType;
        fromDate: Date;
        toDate: Date;
        totalDays: number;
        attachmentUrl: string | null;
        reviewedAt: Date | null;
        remarks: string | null;
        appliedAt: Date;
        reviewedById: string | null;
    }>;
    approve(id: string, reviewerId: string, remarks?: string): Promise<{
        id: string;
        updatedAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.LeaveStatus;
        reason: string;
        leaveType: import(".prisma/client").$Enums.LeaveType;
        fromDate: Date;
        toDate: Date;
        totalDays: number;
        attachmentUrl: string | null;
        reviewedAt: Date | null;
        remarks: string | null;
        appliedAt: Date;
        reviewedById: string | null;
    }>;
    reject(id: string, reviewerId: string, remarks: string): Promise<{
        id: string;
        updatedAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.LeaveStatus;
        reason: string;
        leaveType: import(".prisma/client").$Enums.LeaveType;
        fromDate: Date;
        toDate: Date;
        totalDays: number;
        attachmentUrl: string | null;
        reviewedAt: Date | null;
        remarks: string | null;
        appliedAt: Date;
        reviewedById: string | null;
    }>;
    cancel(id: string, userId: string, role: SystemRole): Promise<{
        id: string;
        updatedAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.LeaveStatus;
        reason: string;
        leaveType: import(".prisma/client").$Enums.LeaveType;
        fromDate: Date;
        toDate: Date;
        totalDays: number;
        attachmentUrl: string | null;
        reviewedAt: Date | null;
        remarks: string | null;
        appliedAt: Date;
        reviewedById: string | null;
    }>;
    getBalance(employeeId: string, year?: number): Promise<{
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
    }>;
}
