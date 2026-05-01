import { LeaveService } from './leave.service';
import { LeaveType } from '@prisma/client';
declare class ApplyLeaveDto {
    leaveType: LeaveType;
    fromDate: string;
    toDate: string;
    reason: string;
    attachmentUrl?: string;
}
declare class ReviewLeaveDto {
    remarks?: string;
}
export declare class LeaveController {
    private leaveService;
    constructor(leaveService: LeaveService);
    findAll(query: Record<string, string>, user: Record<string, unknown>): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
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
    apply(dto: ApplyLeaveDto, userId: string): Promise<{
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
    approve(id: string, dto: ReviewLeaveDto, userId: string): Promise<{
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
    reject(id: string, dto: ReviewLeaveDto, userId: string): Promise<{
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
    cancel(id: string, user: Record<string, unknown>): Promise<{
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
    getBalance(employeeId: string): Promise<{
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
    getBalanceByYear(employeeId: string, year: string): Promise<{
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
export {};
