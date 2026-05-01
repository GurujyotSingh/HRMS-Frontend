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
exports.LeaveController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const leave_service_1 = require("./leave.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class ApplyLeaveDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ enum: client_1.LeaveType }),
    (0, class_validator_1.IsEnum)(client_1.LeaveType),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "leaveType", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "fromDate", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "toDate", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyLeaveDto.prototype, "attachmentUrl", void 0);
class ReviewLeaveDto {
}
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewLeaveDto.prototype, "remarks", void 0);
let LeaveController = class LeaveController {
    constructor(leaveService) {
        this.leaveService = leaveService;
    }
    findAll(query, user) {
        return this.leaveService.findAll(query, user);
    }
    apply(dto, userId) {
        return this.leaveService.apply(userId, dto);
    }
    approve(id, dto, userId) {
        return this.leaveService.approve(id, userId, dto.remarks);
    }
    reject(id, dto, userId) {
        return this.leaveService.reject(id, userId, dto.remarks || '');
    }
    cancel(id, user) {
        return this.leaveService.cancel(id, user.sub, user.role);
    }
    getBalance(employeeId) {
        return this.leaveService.getBalance(employeeId);
    }
    getBalanceByYear(employeeId, year) {
        return this.leaveService.getBalance(employeeId, parseInt(year, 10));
    }
};
exports.LeaveController = LeaveController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List leave requests (role-scoped)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('leave:apply'),
    (0, audit_decorator_1.Audit)('LEAVE_APPLIED'),
    (0, swagger_1.ApiOperation)({ summary: 'Apply for leave' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ApplyLeaveDto, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "apply", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('leave:approve_all', 'leave:approve_department'),
    (0, audit_decorator_1.Audit)('LEAVE_APPROVED'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve leave request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReviewLeaveDto, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('leave:approve_all', 'leave:approve_department'),
    (0, audit_decorator_1.Audit)('LEAVE_REJECTED'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject leave request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ReviewLeaveDto, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, audit_decorator_1.Audit)('LEAVE_CANCELLED'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel leave request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('balance/:employeeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get leave balance for current year' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('balance/:employeeId/:year'),
    (0, swagger_1.ApiOperation)({ summary: 'Get leave balance for specific year' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Param)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "getBalanceByYear", null);
exports.LeaveController = LeaveController = __decorate([
    (0, swagger_1.ApiTags)('Leave'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('leave'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    __metadata("design:paramtypes", [leave_service_1.LeaveService])
], LeaveController);
//# sourceMappingURL=leave.controller.js.map