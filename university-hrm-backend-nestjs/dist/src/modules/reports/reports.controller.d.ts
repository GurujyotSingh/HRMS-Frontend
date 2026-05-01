import { ReportsService } from './reports.service';
export declare class ReportsController {
    private svc;
    constructor(svc: ReportsService);
    attendance(q: Record<string, string>): Promise<{
        data: ({
            employee: {
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
        })[];
        generatedAt: Date;
    }>;
    leave(q: Record<string, string>): Promise<{
        data: ({
            employee: {
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
        })[];
        generatedAt: Date;
    }>;
    headcount(q: Record<string, string>): Promise<{
        departments: {
            name: string;
            code: string;
            headCount: number;
        }[];
        byEmploymentType: {
            type: import(".prisma/client").$Enums.EmploymentType;
            count: number;
        }[];
        byRole: {
            role: import(".prisma/client").$Enums.SystemRole;
            count: number;
        }[];
        totalActive: number;
        generatedAt: Date;
    }>;
    payroll(q: Record<string, string>): Promise<{
        data: ({
            employee: {
                department: {
                    name: string;
                } | null;
                employeeId: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            workingDays: number;
            employeeId: string;
            status: import(".prisma/client").$Enums.PayslipStatus;
            year: number;
            publishedAt: Date | null;
            notes: string | null;
            month: number;
            daysPresent: number;
            daysAbsent: number;
            daysOnLeave: number;
            basicSalary: number;
            hra: number;
            ta: number;
            da: number;
            otherAllowances: number;
            grossSalary: number;
            absentDeduction: number;
            pfDeduction: number;
            professionalTax: number;
            tdsDeduction: number;
            totalDeductions: number;
            netSalary: number;
            pdfUrl: string | null;
            generatedAt: Date;
        })[];
        summary: {
            totalNet: number;
            totalBasic: number;
            count: number;
        };
        generatedAt: Date;
    }>;
}
