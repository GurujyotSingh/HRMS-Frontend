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
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PerformanceService = class PerformanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCycle(data) {
        return this.prisma.appraisalCycle.create({
            data: {
                title: data.title,
                year: Number(data.year),
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                status: client_1.CycleStatus.ACTIVE,
            },
        });
    }
    async getAllCycles() {
        return this.prisma.appraisalCycle.findMany({
            orderBy: { year: 'desc' },
            include: { _count: { select: { goals: true } } },
        });
    }
    async getActiveCycle() {
        return this.prisma.appraisalCycle.findFirst({
            where: { status: client_1.CycleStatus.ACTIVE },
            orderBy: { createdAt: 'desc' },
        });
    }
    async closeCycle(id) {
        const cycle = await this.prisma.appraisalCycle.findUnique({ where: { id } });
        if (!cycle)
            throw new common_1.NotFoundException('Appraisal cycle not found');
        return this.prisma.appraisalCycle.update({
            where: { id },
            data: { status: client_1.CycleStatus.CLOSED },
        });
    }
    async createGoal(employeeId, data) {
        const cycle = await this.prisma.appraisalCycle.findUnique({
            where: { id: data.cycleId },
        });
        if (!cycle)
            throw new common_1.NotFoundException('Appraisal cycle not found');
        if (cycle.status !== client_1.CycleStatus.ACTIVE) {
            throw new common_1.BadRequestException('Cannot set goals for a closed appraisal cycle');
        }
        const existing = await this.prisma.performanceGoal.findUnique({
            where: { employeeId_cycleId: { employeeId, cycleId: data.cycleId } },
        });
        if (existing)
            throw new common_1.BadRequestException('Goals already submitted for this cycle');
        return this.prisma.performanceGoal.create({
            data: {
                employeeId,
                cycleId: data.cycleId,
                goalsText: data.goalsText,
                status: client_1.GoalStatus.DRAFT,
            },
            include: { cycle: true, employee: { select: { firstName: true, lastName: true, employeeId: true } } },
        });
    }
    async submitGoal(goalId, employeeId) {
        const goal = await this.prisma.performanceGoal.findFirst({
            where: { id: goalId, employeeId },
        });
        if (!goal)
            throw new common_1.NotFoundException('Goal not found');
        if (goal.status !== client_1.GoalStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft goals can be submitted');
        }
        return this.prisma.performanceGoal.update({
            where: { id: goalId },
            data: { status: client_1.GoalStatus.SUBMITTED, updatedAt: new Date() },
        });
    }
    async selfReview(goalId, employeeId, data) {
        const goal = await this.prisma.performanceGoal.findFirst({
            where: { id: goalId, employeeId },
        });
        if (!goal)
            throw new common_1.NotFoundException('Goal not found');
        return this.prisma.performanceGoal.update({
            where: { id: goalId },
            data: {
                selfRating: Number(data.selfRating),
                selfComments: data.selfComments,
                updatedAt: new Date(),
            },
        });
    }
    async getMyGoals(employeeId) {
        return this.prisma.performanceGoal.findMany({
            where: { employeeId },
            include: { cycle: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getDirectorPendingGoals(departmentId) {
        return this.prisma.performanceGoal.findMany({
            where: {
                status: client_1.GoalStatus.SUBMITTED,
                employee: { departmentId },
            },
            include: {
                cycle: true,
                employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, designation: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async directorReview(goalId, reviewerId, departmentId, data) {
        const goal = await this.prisma.performanceGoal.findFirst({
            where: {
                id: goalId,
                status: client_1.GoalStatus.SUBMITTED,
                employee: { departmentId },
            },
        });
        if (!goal)
            throw new common_1.NotFoundException('Goal not found or not in your department');
        return this.prisma.performanceGoal.update({
            where: { id: goalId },
            data: {
                directorRating: Number(data.directorRating),
                directorComments: data.directorComments,
                reviewedById: reviewerId,
                reviewedAt: new Date(),
                status: client_1.GoalStatus.DIRECTOR_REVIEWED,
                updatedAt: new Date(),
            },
        });
    }
    async assignGoal(directorId, departmentId, data) {
        const targetEmp = await this.prisma.user.findFirst({
            where: { id: data.employeeId, departmentId },
        });
        if (!targetEmp)
            throw new common_1.BadRequestException('Employee not in your department');
        return this.createGoal(data.employeeId, { cycleId: data.cycleId, goalsText: data.goalsText });
    }
    async getAllGoals(cycleId) {
        return this.prisma.performanceGoal.findMany({
            where: cycleId ? { cycleId } : undefined,
            include: {
                cycle: true,
                employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async hrFinalize(goalId, hrId, data) {
        const goal = await this.prisma.performanceGoal.findUnique({ where: { id: goalId } });
        if (!goal)
            throw new common_1.NotFoundException('Goal not found');
        if (goal.status !== client_1.GoalStatus.DIRECTOR_REVIEWED) {
            throw new common_1.BadRequestException('Goal must be Director-reviewed before HR can finalize');
        }
        return this.prisma.performanceGoal.update({
            where: { id: goalId },
            data: {
                finalRating: Number(data.finalRating),
                hrComments: data.hrComments,
                finalizedById: hrId,
                finalizedAt: new Date(),
                status: client_1.GoalStatus.FINALIZED,
                updatedAt: new Date(),
            },
        });
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map