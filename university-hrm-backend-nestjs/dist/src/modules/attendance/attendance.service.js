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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
let AttendanceService = class AttendanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, currentUser) {
        const where = {};
        if (currentUser.role === 'FACULTY' || currentUser.role === 'STAFF') {
            where.employeeId = currentUser.sub;
        }
        else if (currentUser.role === 'DIRECTOR') {
            where.employee = { departmentId: currentUser.departmentId };
        }
        if (query.employeeId)
            where.employeeId = query.employeeId;
        if (query.departmentId)
            where.employee = { departmentId: query.departmentId };
        if (query.status)
            where.status = query.status;
        if (query.month && query.year) {
            const m = Number(query.month) - 1;
            const y = Number(query.year);
            where.date = { gte: new Date(y, m, 1), lt: new Date(y, m + 1, 1) };
        }
        else {
            if (query.fromDate)
                where.date = { ...where.date, gte: new Date(query.fromDate) };
            if (query.toDate)
                where.date = { ...where.date, lte: new Date(query.toDate) };
        }
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const [data, total] = await Promise.all([
            this.prisma.attendance.findMany({
                where,
                include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } } },
                orderBy: { date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.attendance.count({ where }),
        ]);
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async getCalendar(employeeId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const [records, holidays] = await Promise.all([
            this.prisma.attendance.findMany({
                where: { employeeId, date: { gte: startDate, lte: endDate } },
                orderBy: { date: 'asc' },
            }),
            this.prisma.holiday.findMany({
                where: { date: { gte: startDate, lte: endDate } },
                orderBy: { date: 'asc' },
            }),
        ]);
        return { records, holidays };
    }
    async getSummary(employeeId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const records = await this.prisma.attendance.findMany({
            where: { employeeId, date: { gte: startDate, lte: endDate } },
        });
        const summary = {
            presentCount: 0, absentCount: 0, halfDayCount: 0,
            lateCount: 0, holidayCount: 0, onLeaveCount: 0,
            weekendCount: 0, totalWorkingDays: 0, attendanceRate: 0,
        };
        for (const r of records) {
            switch (r.status) {
                case 'PRESENT':
                    summary.presentCount++;
                    break;
                case 'ABSENT':
                    summary.absentCount++;
                    break;
                case 'HALF_DAY':
                    summary.halfDayCount++;
                    break;
                case 'HOLIDAY':
                    summary.holidayCount++;
                    break;
                case 'ON_LEAVE':
                    summary.onLeaveCount++;
                    break;
                case 'WEEKEND':
                    summary.weekendCount++;
                    break;
            }
            if (r.isLate)
                summary.lateCount++;
        }
        summary.totalWorkingDays = summary.presentCount + summary.absentCount + summary.halfDayCount + summary.onLeaveCount;
        summary.attendanceRate = summary.totalWorkingDays > 0
            ? Math.round(((summary.presentCount + summary.halfDayCount * 0.5) / summary.totalWorkingDays) * 100)
            : 0;
        return summary;
    }
    async bulkUpsert(date, records) {
        const dateObj = new Date(date);
        const results = [];
        for (const rec of records) {
            const checkIn = rec.checkIn ? new Date(rec.checkIn) : null;
            const checkOut = rec.checkOut ? new Date(rec.checkOut) : null;
            let totalHours = null;
            if (checkIn && checkOut) {
                totalHours = Math.round(((checkOut.getTime() - checkIn.getTime()) / 3600000) * 100) / 100;
            }
            const result = await this.prisma.attendance.upsert({
                where: { employeeId_date: { employeeId: rec.employeeId, date: dateObj } },
                create: { employeeId: rec.employeeId, date: dateObj, checkIn, checkOut, totalHours, status: rec.status, isLate: rec.isLate || false, notes: rec.notes },
                update: { checkIn, checkOut, totalHours, status: rec.status, isLate: rec.isLate || false, notes: rec.notes },
            });
            results.push(result);
        }
        return results;
    }
    async correct(id, data, correctedBy) {
        const record = await this.prisma.attendance.findUnique({ where: { id } });
        if (!record)
            throw new common_1.NotFoundException('Attendance record not found');
        const checkIn = data.checkIn ? new Date(data.checkIn) : record.checkIn;
        const checkOut = data.checkOut ? new Date(data.checkOut) : record.checkOut;
        let totalHours = record.totalHours;
        if (checkIn && checkOut) {
            totalHours = Math.round(((checkOut.getTime() - checkIn.getTime()) / 3600000) * 100) / 100;
        }
        return this.prisma.attendance.update({
            where: { id },
            data: { checkIn, checkOut, totalHours, status: data.status || record.status, notes: data.notes, correctedBy, correctedAt: new Date() },
        });
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map