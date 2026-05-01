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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DepartmentsService = class DepartmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const departments = await this.prisma.department.findMany({
            include: {
                director: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
                _count: { select: { employees: true } },
            },
            orderBy: { name: 'asc' },
        });
        return departments.map((d) => ({
            ...d,
            headCount: d._count.employees,
            _count: undefined,
        }));
    }
    async findOne(id) {
        const dept = await this.prisma.department.findUnique({
            where: { id },
            include: {
                director: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
                employees: {
                    select: { id: true, employeeId: true, firstName: true, lastName: true, role: true, designation: true, profilePhoto: true, status: true },
                    orderBy: { firstName: 'asc' },
                },
            },
        });
        if (!dept)
            throw new common_1.NotFoundException('Department not found');
        return dept;
    }
    async create(data) {
        return this.prisma.department.create({ data });
    }
    async update(id, data) {
        if (data.directorId) {
            const existing = await this.prisma.department.findUnique({ where: { id } });
            if (existing?.directorId && existing.directorId !== data.directorId) {
            }
        }
        return this.prisma.department.update({ where: { id }, data });
    }
    async remove(id) {
        const dept = await this.prisma.department.findUnique({
            where: { id },
            include: { _count: { select: { employees: true } } },
        });
        if (!dept)
            throw new common_1.NotFoundException('Department not found');
        if (dept._count.employees > 0) {
            throw new common_1.BadRequestException('Cannot delete department with active employees');
        }
        return this.prisma.department.delete({ where: { id } });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map