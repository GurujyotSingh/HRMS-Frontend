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
exports.RecruitmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
const password_util_1 = require("../../common/utils/password.util");
const employee_id_util_1 = require("../../common/utils/employee-id.util");
let RecruitmentService = class RecruitmentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllJobs(query) {
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.departmentId)
            where.departmentId = query.departmentId;
        if (query.type)
            where.type = query.type;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const [data, total] = await Promise.all([
            this.prisma.recruitmentJob.findMany({
                where, include: { department: { select: { name: true } }, _count: { select: { applicants: true } } },
                orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
            }),
            this.prisma.recruitmentJob.count({ where }),
        ]);
        return (0, pagination_util_1.paginate)(data.map(j => ({ ...j, applicantCount: j._count.applicants, _count: undefined })), total, page, limit);
    }
    async findOneJob(id) {
        const job = await this.prisma.recruitmentJob.findUnique({
            where: { id },
            include: {
                department: { select: { name: true } },
                applicants: { orderBy: { appliedAt: 'desc' } },
            },
        });
        if (!job)
            throw new common_1.NotFoundException('Job not found');
        const statusCounts = {};
        for (const a of job.applicants) {
            statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
        }
        return { ...job, statusCounts };
    }
    async createJob(data) {
        return this.prisma.recruitmentJob.create({
            data: {
                title: data.title,
                departmentId: data.departmentId,
                type: data.type,
                description: data.description,
                requirements: data.requirements || [],
                closingDate: new Date(data.closingDate),
            },
        });
    }
    async updateJob(id, data) {
        const updateData = {};
        if (data.title)
            updateData.title = data.title;
        if (data.description)
            updateData.description = data.description;
        if (data.requirements)
            updateData.requirements = data.requirements;
        if (data.status)
            updateData.status = data.status;
        if (data.closingDate)
            updateData.closingDate = new Date(data.closingDate);
        return this.prisma.recruitmentJob.update({ where: { id }, data: updateData });
    }
    async deleteJob(id) { return this.prisma.recruitmentJob.delete({ where: { id } }); }
    async getApplicants(jobId, query) {
        const where = { jobId };
        if (query.status)
            where.status = query.status;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const [data, total] = await Promise.all([
            this.prisma.recruitmentApplicant.findMany({ where, orderBy: { appliedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            this.prisma.recruitmentApplicant.count({ where }),
        ]);
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async addApplicant(jobId, data) {
        return this.prisma.recruitmentApplicant.create({
            data: { jobId, name: data.name, email: data.email, phone: data.phone, resumeUrl: data.resumeUrl, notes: data.notes },
        });
    }
    async updateApplicant(id, data) {
        return this.prisma.recruitmentApplicant.update({ where: { id }, data: { status: data.status, notes: data.notes } });
    }
    async convertToEmployee(applicantId) {
        const applicant = await this.prisma.recruitmentApplicant.findUnique({ where: { id: applicantId }, include: { job: true } });
        if (!applicant)
            throw new common_1.NotFoundException('Applicant not found');
        const empId = await (0, employee_id_util_1.generateEmployeeId)(this.prisma);
        const passwordHash = await (0, password_util_1.hashPassword)('Welcome@123');
        const names = applicant.name.split(' ');
        const user = await this.prisma.user.create({
            data: {
                employeeId: empId, firstName: names[0] || applicant.name, lastName: names.slice(1).join(' ') || '',
                email: applicant.email, workEmail: applicant.email, passwordHash,
                phone: applicant.phone, departmentId: applicant.job.departmentId,
                employmentType: applicant.job.type, joinDate: new Date(),
            },
        });
        await this.prisma.recruitmentApplicant.update({ where: { id: applicantId }, data: { status: 'HIRED' } });
        await this.prisma.leaveBalance.create({ data: { employeeId: user.id, year: new Date().getFullYear() } });
        return user;
    }
};
exports.RecruitmentService = RecruitmentService;
exports.RecruitmentService = RecruitmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecruitmentService);
//# sourceMappingURL=recruitment.service.js.map