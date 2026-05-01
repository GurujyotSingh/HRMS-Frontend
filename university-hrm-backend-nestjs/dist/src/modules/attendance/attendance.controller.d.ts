import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private attendanceService;
    constructor(attendanceService: AttendanceService);
    findAll(query: Record<string, string>, user: Record<string, unknown>): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
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
    getCalendar(id: string, month: string, year: string): Promise<{
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
    getSummary(id: string, month: string, year: string): Promise<{
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
    bulkUpsert(body: {
        date: string;
        records: Array<Record<string, unknown>>;
    }): Promise<{
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
    correct(id: string, body: Record<string, unknown>, userId: string): Promise<{
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
