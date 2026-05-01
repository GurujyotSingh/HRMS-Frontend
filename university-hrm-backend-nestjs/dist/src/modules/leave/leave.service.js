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
exports.LeaveService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const working_days_util_1 = require("../../common/utils/working-days.util");
const pagination_util_1 = require("../../common/utils/pagination.util");
let LeaveService = class LeaveService {
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
        if (query.status)
            where.status = query.status;
        if (query.leaveType)
            where.leaveType = query.leaveType;
        if (query.departmentId)
            where.employee = { ...where.employee, departmentId: query.departmentId };
        if (query.fromDate)
            where.fromDate = { gte: new Date(query.fromDate) };
        if (query.toDate)
            where.toDate = { lte: new Date(query.toDate) };
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const [data, total] = await Promise.all([
            this.prisma.leaveRequest.findMany({
                where,
                include: {
                    employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } }, profilePhoto: true } },
                    reviewedBy: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: [{ status: 'asc' }, { appliedAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.leaveRequest.count({ where }),
        ]);
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async apply(userId, dto) {
        const from = new Date(dto.fromDate);
        const to = new Date(dto.toDate);
        if (from > to)
            throw new common_1.BadRequestException('From date must be before to date');
        const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
        const totalDays = await (0, working_days_util_1.calculateWorkingDays)(this.prisma, from, to, settings?.workingDays);
        if (totalDays === 0)
            throw new common_1.BadRequestException('No working days in the selected range');
        const year = from.getFullYear();
        const balance = await this.prisma.leaveBalance.findUnique({
            where: { employeeId_year: { employeeId: userId, year } },
        });
        if (!balance)
            throw new common_1.BadRequestException('Leave balance not found for this year');
        const typeKey = dto.leaveType.toLowerCase();
        if (dto.leaveType !== 'UNPAID') {
            const totalField = `${typeKey}Total`;
            const usedField = `${typeKey}Used`;
            const remaining = balance[totalField] - balance[usedField];
            if (totalDays > remaining) {
                throw new common_1.BadRequestException(`Insufficient ${dto.leaveType} leave balance. Remaining: ${remaining} days`);
            }
        }
        const overlap = await this.prisma.leaveRequest.findFirst({
            where: {
                employeeId: userId,
                status: 'APPROVED',
                OR: [
                    { fromDate: { lte: to }, toDate: { gte: from } },
                ],
            },
        });
        if (overlap)
            throw new common_1.BadRequestException('You have an overlapping approved leave for this period');
        return this.prisma.leaveRequest.create({
            data: {
                employeeId: userId,
                leaveType: dto.leaveType,
                fromDate: from,
                toDate: to,
                totalDays,
                reason: dto.reason,
                attachmentUrl: dto.attachmentUrl,
            },
            include: {
                employee: { select: { firstName: true, lastName: true, employeeId: true } },
            },
        });
    }
    async approve(id, reviewerId, remarks) {
        const leave = await this.prisma.leaveRequest.findUnique({
            where: { id },
            include: { employee: true },
        });
        if (!leave)
            throw new common_1.NotFoundException('Leave request not found');
        if (leave.status !== 'PENDING')
            throw new common_1.BadRequestException('Only pending requests can be approved');
        const year = leave.fromDate.getFullYear();
        const typeKey = leave.leaveType.toLowerCase();
        if (leave.leaveType !== 'UNPAID') {
            const usedField = `${typeKey}Used`;
            await this.prisma.leaveBalance.update({
                where: { employeeId_year: { employeeId: leave.employeeId, year } },
                data: { [usedField]: { increment: leave.totalDays } },
            });
        }
        else {
            await this.prisma.leaveBalance.update({
                where: { employeeId_year: { employeeId: leave.employeeId, year } },
                data: { unpaidUsed: { increment: leave.totalDays } },
            });
        }
        return this.prisma.leaveRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                reviewedById: reviewerId,
                reviewedAt: new Date(),
                remarks,
            },
        });
    }
    async reject(id, reviewerId, remarks) {
        const leave = await this.prisma.leaveRequest.findUnique({ where: { id } });
        if (!leave)
            throw new common_1.NotFoundException('Leave request not found');
        if (leave.status !== 'PENDING')
            throw new common_1.BadRequestException('Only pending requests can be rejected');
        if (!remarks)
            throw new common_1.BadRequestException('Remarks are required for rejection');
        return this.prisma.leaveRequest.update({
            where: { id },
            data: { status: 'REJECTED', reviewedById: reviewerId, reviewedAt: new Date(), remarks },
        });
    }
    async cancel(id, userId, role) {
        const leave = await this.prisma.leaveRequest.findUnique({ where: { id } });
        if (!leave)
            throw new common_1.NotFoundException('Leave request not found');
        if (role === 'FACULTY' || role === 'STAFF') {
            if (leave.employeeId !== userId)
                throw new common_1.ForbiddenException('You can only cancel your own leave');
            if (leave.status !== 'PENDING')
                throw new common_1.BadRequestException('You can only cancel pending requests');
        }
        if (leave.status === 'APPROVED') {
            const year = leave.fromDate.getFullYear();
            const typeKey = leave.leaveType.toLowerCase();
            if (leave.leaveType !== 'UNPAID') {
                const usedField = `${typeKey}Used`;
                await this.prisma.leaveBalance.update({
                    where: { employeeId_year: { employeeId: leave.employeeId, year } },
                    data: { [usedField]: { decrement: leave.totalDays } },
                });
            }
            else {
                await this.prisma.leaveBalance.update({
                    where: { employeeId_year: { employeeId: leave.employeeId, year } },
                    data: { unpaidUsed: { decrement: leave.totalDays } },
                });
            }
            await this.prisma.attendance.deleteMany({
                where: {
                    employeeId: leave.employeeId,
                    date: { gte: leave.fromDate, lte: leave.toDate },
                    status: 'ON_LEAVE',
                },
            });
        }
        return this.prisma.leaveRequest.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }
    async getBalance(employeeId, year) {
        const y = year || new Date().getFullYear();
        const balance = await this.prisma.leaveBalance.findUnique({
            where: { employeeId_year: { employeeId, year: y } },
        });
        if (!balance)
            throw new common_1.NotFoundException('Leave balance not found');
        return balance;
    }
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaveService);
//# sourceMappingURL=leave.service.js.map