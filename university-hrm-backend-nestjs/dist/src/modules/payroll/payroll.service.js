"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const pagination_util_1 = require("../../common/utils/pagination.util");
let PayrollService = class PayrollService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async setSalaryStructure(employeeId, data) {
        return this.prisma.salaryStructure.upsert({
            where: { employeeId },
            create: {
                employeeId,
                basicSalary: data.basicSalary,
                hra: data.hra ?? 0,
                ta: data.ta ?? 0,
                da: data.da ?? 0,
                otherAllowances: data.otherAllowances ?? 0,
                pfDeduction: data.pfDeduction ?? 0,
                professionalTax: data.professionalTax ?? 0,
                tdsRate: data.tdsRate ?? 0,
                workingDaysPerMonth: data.workingDaysPerMonth ?? 26,
            },
            update: {
                basicSalary: data.basicSalary,
                hra: data.hra ?? 0,
                ta: data.ta ?? 0,
                da: data.da ?? 0,
                otherAllowances: data.otherAllowances ?? 0,
                pfDeduction: data.pfDeduction ?? 0,
                professionalTax: data.professionalTax ?? 0,
                tdsRate: data.tdsRate ?? 0,
                workingDaysPerMonth: data.workingDaysPerMonth ?? 26,
                updatedAt: new Date(),
            },
        });
    }
    async getSalaryStructure(employeeId) {
        return this.prisma.salaryStructure.findUnique({ where: { employeeId } });
    }
    async findAll(query, currentUser) {
        const where = {};
        if (currentUser.role === client_1.SystemRole.FACULTY || currentUser.role === client_1.SystemRole.STAFF) {
            where.employeeId = currentUser.sub;
            where.status = 'PUBLISHED';
        }
        if (query.employeeId)
            where.employeeId = query.employeeId;
        if (query.month)
            where.month = Number(query.month);
        if (query.year)
            where.year = Number(query.year);
        if (query.status)
            where.status = query.status;
        if (query.departmentId) {
            where.employee = { departmentId: query.departmentId };
        }
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const [data, total] = await Promise.all([
            this.prisma.payslip.findMany({
                where,
                include: {
                    employee: {
                        select: {
                            id: true, firstName: true, lastName: true, employeeId: true,
                            designation: true, department: { select: { name: true } },
                        },
                    },
                },
                orderBy: [{ year: 'desc' }, { month: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.payslip.count({ where }),
        ]);
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async findOne(id) {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true, firstName: true, lastName: true, employeeId: true,
                        designation: true, joinDate: true,
                        department: { select: { name: true } },
                        salaryStructure: true,
                    },
                },
            },
        });
        if (!payslip)
            throw new common_1.NotFoundException('Payslip not found');
        return payslip;
    }
    async generateForEmployee(employeeId, month, year, notes) {
        const structure = await this.prisma.salaryStructure.findUnique({ where: { employeeId } });
        if (!structure) {
            throw new common_1.BadRequestException(`No salary structure for employee ${employeeId}. Set it first.`);
        }
        const existing = await this.prisma.payslip.findUnique({
            where: { employeeId_month_year: { employeeId, month, year } },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Payslip for ${month}/${year} already exists`);
        }
        const { daysPresent, daysAbsent, daysOnLeave } = await this.getAttendanceStats(employeeId, month, year, structure.workingDaysPerMonth);
        const calc = this.calculatePayslip(structure, daysPresent, daysAbsent, daysOnLeave);
        return this.prisma.payslip.create({
            data: {
                employeeId,
                month,
                year,
                notes: notes || null,
                ...calc,
                status: 'DRAFT',
                generatedAt: new Date(),
            },
            include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
        });
    }
    async generate(data) {
        const month = Number(data.month);
        const year = Number(data.year);
        const departmentId = data.departmentId;
        const employeeId = data.employeeId;
        if (employeeId) {
            return this.generateForEmployee(employeeId, month, year, data.notes);
        }
        const where = { status: 'ACTIVE' };
        if (departmentId)
            where.departmentId = departmentId;
        const employees = await this.prisma.user.findMany({
            where,
            include: { salaryStructure: true },
        });
        const results = { success: 0, failed: 0, errors: [] };
        for (const emp of employees) {
            if (!emp.salaryStructure) {
                results.failed++;
                results.errors.push(`${emp.firstName} ${emp.lastName}: No salary structure`);
                continue;
            }
            const { daysPresent, daysAbsent, daysOnLeave } = await this.getAttendanceStats(emp.id, month, year, emp.salaryStructure.workingDaysPerMonth);
            const calc = this.calculatePayslip(emp.salaryStructure, daysPresent, daysAbsent, daysOnLeave);
            try {
                await this.prisma.payslip.upsert({
                    where: { employeeId_month_year: { employeeId: emp.id, month, year } },
                    create: { employeeId: emp.id, month, year, ...calc, status: 'DRAFT', generatedAt: new Date() },
                    update: { ...calc, status: 'DRAFT', generatedAt: new Date() },
                });
                results.success++;
            }
            catch (e) {
                results.failed++;
                results.errors.push(`${emp.firstName}: ${e.message}`);
            }
        }
        return { ...results, month, year };
    }
    async publish(id) {
        const payslip = await this.prisma.payslip.findUnique({ where: { id } });
        if (!payslip)
            throw new common_1.NotFoundException('Payslip not found');
        return this.prisma.payslip.update({
            where: { id },
            data: { status: 'PUBLISHED', publishedAt: new Date() },
        });
    }
    async getSummary(month, year) {
        const payslips = await this.prisma.payslip.findMany({ where: { month, year } });
        const totalGross = payslips.reduce((s, p) => s + p.grossSalary, 0);
        const totalDeductions = payslips.reduce((s, p) => s + p.totalDeductions, 0);
        const totalNet = payslips.reduce((s, p) => s + p.netSalary, 0);
        return {
            month, year,
            totalEmployees: payslips.length,
            totalGross: Math.round(totalGross * 100) / 100,
            totalDeductions: Math.round(totalDeductions * 100) / 100,
            totalNet: Math.round(totalNet * 100) / 100,
        };
    }
    async getAttendanceStats(employeeId, month, year, workingDays) {
        const presentCount = await this.prisma.attendance.count({
            where: {
                employeeId,
                status: client_1.AttendanceStatus.PRESENT,
                date: {
                    gte: new Date(year, month - 1, 1),
                    lt: new Date(year, month, 1),
                },
            },
        });
        const approvedLeaves = await this.prisma.leaveRequest.findMany({
            where: {
                employeeId,
                status: client_1.LeaveStatus.APPROVED,
                fromDate: {
                    gte: new Date(year, month - 1, 1),
                    lt: new Date(year, month, 1),
                },
            },
            select: { fromDate: true, toDate: true, totalDays: true },
        });
        const daysOnLeave = approvedLeaves.reduce((s, l) => s + l.totalDays, 0);
        const daysPresent = presentCount;
        const daysAbsent = Math.max(workingDays - daysPresent - daysOnLeave, 0);
        return { daysPresent, daysAbsent, daysOnLeave };
    }
    calculatePayslip(structure, daysPresent, daysAbsent, daysOnLeave) {
        const r2 = (v) => Math.round(v * 100) / 100;
        const workingDays = structure.workingDaysPerMonth;
        const perDayRate = structure.basicSalary / workingDays;
        const paidDays = daysPresent + daysOnLeave;
        const ratio = workingDays > 0 ? paidDays / workingDays : 0;
        const basic = r2(structure.basicSalary * ratio);
        const hra = r2(structure.hra * ratio);
        const ta = r2(structure.ta * ratio);
        const da = r2(structure.da * ratio);
        const other = r2(structure.otherAllowances * ratio);
        const gross = r2(basic + hra + ta + da + other);
        const absentDeduction = r2(perDayRate * daysAbsent);
        const pf = r2(structure.pfDeduction);
        const profTax = r2(structure.professionalTax);
        const tds = r2(gross * structure.tdsRate / 100);
        const totalDeductions = r2(absentDeduction + pf + profTax + tds);
        const netSalary = r2(gross - totalDeductions);
        return {
            workingDays,
            daysPresent,
            daysAbsent,
            daysOnLeave,
            basicSalary: basic,
            hra,
            ta,
            da,
            otherAllowances: other,
            grossSalary: gross,
            absentDeduction,
            pfDeduction: pf,
            professionalTax: profTax,
            tdsDeduction: tds,
            totalDeductions,
            netSalary,
        };
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map