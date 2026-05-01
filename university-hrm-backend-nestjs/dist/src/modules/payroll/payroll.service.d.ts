import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole } from '@prisma/client';
export interface SalaryStructureData {
    basicSalary: number;
    hra?: number;
    ta?: number;
    da?: number;
    otherAllowances?: number;
    pfDeduction?: number;
    professionalTax?: number;
    tdsRate?: number;
    workingDaysPerMonth?: number;
}
export declare class PayrollService {
    private prisma;
    constructor(prisma: PrismaService);
    setSalaryStructure(employeeId: string, data: SalaryStructureData): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        basicSalary: number;
        hra: number;
        ta: number;
        da: number;
        otherAllowances: number;
        pfDeduction: number;
        professionalTax: number;
        tdsRate: number;
        workingDaysPerMonth: number;
    }>;
    getSalaryStructure(employeeId: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        basicSalary: number;
        hra: number;
        ta: number;
        da: number;
        otherAllowances: number;
        pfDeduction: number;
        professionalTax: number;
        tdsRate: number;
        workingDaysPerMonth: number;
    } | null>;
    findAll(query: Record<string, unknown>, currentUser: {
        sub: string;
        role: SystemRole;
    }): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
        employee: {
            id: string;
            department: {
                name: string;
            } | null;
            employeeId: string;
            firstName: string;
            lastName: string;
            designation: string | null;
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
    }>>;
    findOne(id: string): Promise<{
        employee: {
            id: string;
            department: {
                name: string;
            } | null;
            employeeId: string;
            firstName: string;
            lastName: string;
            designation: string | null;
            joinDate: Date | null;
            salaryStructure: {
                id: string;
                updatedAt: Date;
                createdAt: Date;
                employeeId: string;
                basicSalary: number;
                hra: number;
                ta: number;
                da: number;
                otherAllowances: number;
                pfDeduction: number;
                professionalTax: number;
                tdsRate: number;
                workingDaysPerMonth: number;
            } | null;
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
    }>;
    generateForEmployee(employeeId: string, month: number, year: number, notes?: string): Promise<{
        employee: {
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
    }>;
    generate(data: Record<string, unknown>): Promise<({
        employee: {
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
    }) | {
        month: number;
        year: number;
        success: number;
        failed: number;
        errors: string[];
    }>;
    publish(id: string): Promise<{
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
    }>;
    getSummary(month: number, year: number): Promise<{
        month: number;
        year: number;
        totalEmployees: number;
        totalGross: number;
        totalDeductions: number;
        totalNet: number;
    }>;
    private getAttendanceStats;
    private calculatePayslip;
}
