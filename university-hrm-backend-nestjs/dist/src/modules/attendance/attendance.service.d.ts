import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole, AttendanceStatus } from '@prisma/client';
export declare class AttendanceService {
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
        };
    } & {
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
    }>>;
    getCalendar(employeeId: string, month: number, year: number): Promise<{
        records: {
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
        holidays: {
            id: string;
            name: string;
            createdAt: Date;
            date: Date;
            type: import(".prisma/client").$Enums.HolidayType;
            isOptional: boolean;
        }[];
    }>;
    getSummary(employeeId: string, month: number, year: number): Promise<{
        presentCount: number;
        absentCount: number;
        halfDayCount: number;
        lateCount: number;
        holidayCount: number;
        onLeaveCount: number;
        weekendCount: number;
        totalWorkingDays: number;
        attendanceRate: number;
    }>;
    bulkUpsert(date: string, records: Array<{
        employeeId: string;
        checkIn?: string;
        checkOut?: string;
        status: AttendanceStatus;
        isLate?: boolean;
        notes?: string;
    }>): Promise<{
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
    }[]>;
    correct(id: string, data: {
        checkIn?: string;
        checkOut?: string;
        status?: AttendanceStatus;
        notes?: string;
    }, correctedBy: string): Promise<{
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
    }>;
}
