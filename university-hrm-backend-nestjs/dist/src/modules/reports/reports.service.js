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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async attendanceReport(query) {
        const where = {};
        if (query.departmentId)
            where.employee = { departmentId: query.departmentId };
        if (query.fromDate)
            where.date = { gte: new Date(query.fromDate) };
        if (query.toDate)
            where.date = { ...where.date, lte: new Date(query.toDate) };
        const data = await this.prisma.attendance.findMany({
            where: where,
            include: { employee: { select: { firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } } },
            orderBy: { date: 'desc' },
        });
        return { data, generatedAt: new Date() };
    }
    async leaveReport(query) {
        const where = {};
        if (query.departmentId)
            where.employee = { departmentId: query.departmentId };
        if (query.year) {
            const y = Number(query.year);
            where.fromDate = { gte: new Date(y, 0, 1) };
            where.toDate = { lte: new Date(y, 11, 31) };
        }
        const data = await this.prisma.leaveRequest.findMany({
            where: where,
            include: { employee: { select: { firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } } },
            orderBy: { appliedAt: 'desc' },
        });
        return { data, generatedAt: new Date() };
    }
    async headcountReport(query) {
        const departments = await this.prisma.department.findMany({
            include: { _count: { select: { employees: true } } },
        });
        const byType = await this.prisma.user.groupBy({
            by: ['employmentType'],
            where: { status: 'ACTIVE' },
            _count: true,
        });
        const byRole = await this.prisma.user.groupBy({
            by: ['role'],
            where: { status: 'ACTIVE' },
            _count: true,
        });
        return {
            departments: departments.map(d => ({ name: d.name, code: d.code, headCount: d._count.employees })),
            byEmploymentType: byType.map(t => ({ type: t.employmentType, count: t._count })),
            byRole: byRole.map(r => ({ role: r.role, count: r._count })),
            totalActive: await this.prisma.user.count({ where: { status: 'ACTIVE' } }),
            generatedAt: new Date(),
        };
    }
    async payrollReport(query) {
        const where = {};
        if (query.month)
            where.month = Number(query.month);
        if (query.year)
            where.year = Number(query.year);
        if (query.departmentId)
            where.employee = { departmentId: query.departmentId };
        const data = await this.prisma.payslip.findMany({
            where: where,
            include: { employee: { select: { firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } } },
        });
        const totalNet = data.reduce((sum, p) => sum + p.netSalary, 0);
        const totalBasic = data.reduce((sum, p) => sum + p.basicSalary, 0);
        return { data, summary: { totalNet, totalBasic, count: data.length }, generatedAt: new Date() };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map