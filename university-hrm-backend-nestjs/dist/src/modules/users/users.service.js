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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const password_util_1 = require("../../common/utils/password.util");
const employee_id_util_1 = require("../../common/utils/employee-id.util");
const pagination_util_1 = require("../../common/utils/pagination.util");
const USER_SELECT = {
    id: true, employeeId: true, firstName: true, lastName: true,
    email: true, workEmail: true, phone: true, personalEmail: true,
    dateOfBirth: true, gender: true, nationality: true, profilePhoto: true,
    bio: true, skills: true, role: true, designation: true,
    departmentId: true, department: { select: { id: true, name: true, code: true } },
    employmentType: true, salary: true, joinDate: true, exitDate: true,
    status: true, street: true, city: true, state: true, country: true,
    pincode: true, emergencyName: true, emergencyRelation: true,
    emergencyPhone: true, emergencyEmail: true, reportingManagerId: true,
    reportingManager: { select: { id: true, firstName: true, lastName: true } },
    createdAt: true, updatedAt: true,
};
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, currentUser) {
        const where = {};
        if (currentUser.role === 'DIRECTOR') {
            where.departmentId = currentUser.departmentId;
        }
        else if (currentUser.role === 'FACULTY' || currentUser.role === 'STAFF') {
            throw new common_1.ForbiddenException('Not authorized to view employee list');
        }
        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { employeeId: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        if (query.departmentId)
            where.departmentId = query.departmentId;
        if (query.status)
            where.status = query.status;
        if (query.employmentType)
            where.employmentType = query.employmentType;
        if (query.role)
            where.role = query.role;
        const { skip, take } = (0, pagination_util_1.paginationArgs)(query);
        const orderBy = {};
        if (query.sortBy) {
            orderBy[query.sortBy] = query.sortOrder || 'asc';
        }
        else {
            orderBy.createdAt = 'desc';
        }
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({ where, select: USER_SELECT, skip, take, orderBy }),
            this.prisma.user.count({ where }),
        ]);
        return (0, pagination_util_1.paginate)(data, total, query.page || 1, query.limit || 20);
    }
    async findOne(id, currentUser) {
        const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (currentUser.role === 'FACULTY' || currentUser.role === 'STAFF') {
            if (id !== currentUser.sub)
                throw new common_1.ForbiddenException('You can only view your own profile');
        }
        if (currentUser.role === 'DIRECTOR' && user.departmentId !== currentUser.departmentId) {
            throw new common_1.ForbiddenException('User is not in your department');
        }
        return user;
    }
    async create(dto) {
        const employeeId = await (0, employee_id_util_1.generateEmployeeId)(this.prisma);
        const passwordHash = await (0, password_util_1.hashPassword)('Welcome@123');
        const user = await this.prisma.user.create({
            data: {
                employeeId,
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                workEmail: dto.workEmail,
                passwordHash,
                phone: dto.phone,
                personalEmail: dto.personalEmail,
                dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                gender: dto.gender,
                nationality: dto.nationality,
                role: dto.role || 'STAFF',
                designation: dto.designation,
                departmentId: dto.departmentId,
                employmentType: dto.employmentType || 'FULL_TIME',
                salary: dto.salary,
                joinDate: dto.joinDate ? new Date(dto.joinDate) : new Date(),
                street: dto.street,
                city: dto.city,
                state: dto.state,
                country: dto.country,
                pincode: dto.pincode,
                emergencyName: dto.emergencyName,
                emergencyRelation: dto.emergencyRelation,
                emergencyPhone: dto.emergencyPhone,
                emergencyEmail: dto.emergencyEmail,
                reportingManagerId: dto.reportingManagerId,
                bio: dto.bio,
                skills: dto.skills || [],
            },
            select: USER_SELECT,
        });
        const year = new Date().getFullYear();
        await this.prisma.leaveBalance.create({
            data: { employeeId: user.id, year },
        });
        return user;
    }
    async update(id, dto, currentUser) {
        const existing = await this.prisma.user.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('User not found');
        let allowedData = {};
        if (currentUser.role === 'SUPER_ADMIN') {
            allowedData = { ...dto };
            if (dto.dateOfBirth)
                allowedData.dateOfBirth = new Date(dto.dateOfBirth);
            if (dto.joinDate)
                allowedData.joinDate = new Date(dto.joinDate);
        }
        else if (currentUser.role === 'HR_MANAGER') {
            const { role, ...rest } = dto;
            allowedData = { ...rest };
            if (dto.dateOfBirth)
                allowedData.dateOfBirth = new Date(dto.dateOfBirth);
            if (dto.joinDate)
                allowedData.joinDate = new Date(dto.joinDate);
        }
        else if (currentUser.role === 'HR_STAFF') {
            allowedData = {
                firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone,
                street: dto.street, city: dto.city, state: dto.state,
                country: dto.country, pincode: dto.pincode,
                emergencyName: dto.emergencyName, emergencyRelation: dto.emergencyRelation,
                emergencyPhone: dto.emergencyPhone, emergencyEmail: dto.emergencyEmail,
            };
        }
        else if (currentUser.role === 'DIRECTOR') {
            if (existing.departmentId !== currentUser.departmentId) {
                throw new common_1.ForbiddenException('User is not in your department');
            }
            allowedData = {
                firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone,
                street: dto.street, city: dto.city, state: dto.state,
                country: dto.country, pincode: dto.pincode,
            };
        }
        else {
            if (id !== currentUser.sub)
                throw new common_1.ForbiddenException('You can only edit your own profile');
            allowedData = {
                firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone,
                personalEmail: dto.personalEmail, bio: dto.bio, skills: dto.skills,
                street: dto.street, city: dto.city, state: dto.state,
                country: dto.country, pincode: dto.pincode,
                emergencyName: dto.emergencyName, emergencyRelation: dto.emergencyRelation,
                emergencyPhone: dto.emergencyPhone, emergencyEmail: dto.emergencyEmail,
            };
        }
        const cleanData = {};
        for (const [key, value] of Object.entries(allowedData)) {
            if (value !== undefined)
                cleanData[key] = value;
        }
        return this.prisma.user.update({
            where: { id },
            data: cleanData,
            select: USER_SELECT,
        });
    }
    async changeRole(id, role) {
        return this.prisma.user.update({
            where: { id },
            data: { role },
            select: USER_SELECT,
        });
    }
    async changeStatus(id, status, reason) {
        return this.prisma.user.update({
            where: { id },
            data: {
                status,
                ...(status === 'INACTIVE' && { exitDate: new Date() }),
            },
            select: USER_SELECT,
        });
    }
    async getStats(employeeId) {
        const user = await this.prisma.user.findUnique({
            where: { id: employeeId },
            select: { joinDate: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const now = new Date();
        const tenure = user.joinDate
            ? Math.floor((now.getTime() - user.joinDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [presentDays, totalDays] = await Promise.all([
            this.prisma.attendance.count({
                where: { employeeId, date: { gte: monthStart }, status: 'PRESENT' },
            }),
            this.prisma.attendance.count({
                where: { employeeId, date: { gte: monthStart }, status: { not: 'WEEKEND' } },
            }),
        ]);
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        const leaveBalance = await this.prisma.leaveBalance.findUnique({
            where: { employeeId_year: { employeeId, year: now.getFullYear() } },
        });
        return { tenure, attendanceRate, leaveBalance };
    }
    async generateNextEmployeeId() {
        return { employeeId: await (0, employee_id_util_1.generateEmployeeId)(this.prisma) };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map