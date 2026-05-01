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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const recruitment_service_1 = require("./recruitment.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
let RecruitmentController = class RecruitmentController {
    constructor(recruitmentService) {
        this.recruitmentService = recruitmentService;
    }
    findAllJobs(q) { return this.recruitmentService.findAllJobs(q); }
    findOneJob(id) { return this.recruitmentService.findOneJob(id); }
    createJob(body) { return this.recruitmentService.createJob(body); }
    updateJob(id, body) { return this.recruitmentService.updateJob(id, body); }
    deleteJob(id) { return this.recruitmentService.deleteJob(id); }
    getApplicants(jobId, q) { return this.recruitmentService.getApplicants(jobId, q); }
    addApplicant(jobId, body) { return this.recruitmentService.addApplicant(jobId, body); }
    updateApplicant(id, body) { return this.recruitmentService.updateApplicant(id, body); }
    convert(id) { return this.recruitmentService.convertToEmployee(id); }
};
exports.RecruitmentController = RecruitmentController;
__decorate([
    (0, common_1.Get)('jobs'),
    (0, swagger_1.ApiOperation)({ summary: 'List jobs' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "findAllJobs", null);
__decorate([
    (0, common_1.Get)('jobs/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get job' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "findOneJob", null);
__decorate([
    (0, common_1.Post)('jobs'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('recruitment:manage'),
    (0, audit_decorator_1.Audit)('JOB_POSTED'),
    (0, swagger_1.ApiOperation)({ summary: 'Create job' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "createJob", null);
__decorate([
    (0, common_1.Patch)('jobs/:id'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('recruitment:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Update job' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "updateJob", null);
__decorate([
    (0, common_1.Delete)('jobs/:id'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('recruitment:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete job' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "deleteJob", null);
__decorate([
    (0, common_1.Get)('jobs/:jobId/applicants'),
    (0, swagger_1.ApiOperation)({ summary: 'List applicants for job' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "getApplicants", null);
__decorate([
    (0, common_1.Post)('jobs/:jobId/applicants'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('recruitment:manage', 'recruitment:assist'),
    (0, swagger_1.ApiOperation)({ summary: 'Add applicant' }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "addApplicant", null);
__decorate([
    (0, common_1.Patch)('applicants/:id'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('recruitment:manage', 'recruitment:assist'),
    (0, audit_decorator_1.Audit)('APPLICANT_STATUS_CHANGED'),
    (0, swagger_1.ApiOperation)({ summary: 'Update applicant' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "updateApplicant", null);
__decorate([
    (0, common_1.Post)('applicants/:id/convert'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('recruitment:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Convert applicant to employee' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecruitmentController.prototype, "convert", null);
exports.RecruitmentController = RecruitmentController = __decorate([
    (0, swagger_1.ApiTags)('Recruitment'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('recruitment'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    __metadata("design:paramtypes", [recruitment_service_1.RecruitmentService])
], RecruitmentController);
//# sourceMappingURL=recruitment.controller.js.map