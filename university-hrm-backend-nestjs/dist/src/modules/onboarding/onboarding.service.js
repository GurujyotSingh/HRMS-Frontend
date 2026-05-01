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
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
let OnboardingService = class OnboardingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.departmentId)
            where.employee = { departmentId: query.departmentId };
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const [data, total] = await Promise.all([
            this.prisma.onboardingEmployee.findMany({
                where, include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } }, profilePhoto: true } }, tasks: { orderBy: { order: 'asc' } } },
                orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
            }),
            this.prisma.onboardingEmployee.count({ where }),
        ]);
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async findOne(id) {
        const ob = await this.prisma.onboardingEmployee.findUnique({
            where: { id },
            include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, department: { select: { name: true } } } }, tasks: { include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { order: 'asc' } } },
        });
        if (!ob)
            throw new common_1.NotFoundException('Onboarding record not found');
        return ob;
    }
    async findByEmployee(employeeId) {
        return this.prisma.onboardingEmployee.findUnique({
            where: { employeeId },
            include: { tasks: { include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { order: 'asc' } } },
        });
    }
    async create(data) {
        return this.prisma.onboardingEmployee.create({
            data: {
                employeeId: data.employeeId,
                startDate: new Date(data.startDate),
                expectedCompletionDate: new Date(data.expectedCompletionDate),
                status: 'IN_PROGRESS',
                tasks: data.tasks ? {
                    create: data.tasks.map((t, i) => ({
                        title: t.title, description: t.description, assignedToId: t.assignedToId,
                        dueDate: new Date(t.dueDate), priority: t.priority || 'MEDIUM', order: i,
                    })),
                } : undefined,
            },
            include: { tasks: true },
        });
    }
    async addTask(onboardingId, data) {
        const maxOrder = await this.prisma.onboardingTask.aggregate({ where: { onboardingId }, _max: { order: true } });
        return this.prisma.onboardingTask.create({
            data: { onboardingId, title: data.title, description: data.description, assignedToId: data.assignedToId, dueDate: new Date(data.dueDate), priority: data.priority || 'MEDIUM', order: (maxOrder._max.order || 0) + 1 },
        });
    }
    async updateTask(taskId, data) {
        const task = await this.prisma.onboardingTask.findUnique({ where: { id: taskId } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const updateData = {};
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.status !== undefined) {
            updateData.status = data.status;
            if (data.status === 'COMPLETED')
                updateData.completedAt = new Date();
        }
        if (data.priority !== undefined)
            updateData.priority = data.priority;
        if (data.dueDate !== undefined)
            updateData.dueDate = new Date(data.dueDate);
        const updated = await this.prisma.onboardingTask.update({ where: { id: taskId }, data: updateData });
        const allTasks = await this.prisma.onboardingTask.findMany({ where: { onboardingId: task.onboardingId } });
        const allComplete = allTasks.every((t) => t.id === taskId ? data.status === 'COMPLETED' : t.status === 'COMPLETED');
        if (allComplete) {
            await this.prisma.onboardingEmployee.update({ where: { id: task.onboardingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
        }
        return updated;
    }
    async reorderTasks(taskIds) {
        const updates = taskIds.map((id, index) => this.prisma.onboardingTask.update({ where: { id }, data: { order: index } }));
        await this.prisma.$transaction(updates);
        return { reordered: taskIds.length };
    }
    async deleteTask(taskId) {
        return this.prisma.onboardingTask.delete({ where: { id: taskId } });
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map