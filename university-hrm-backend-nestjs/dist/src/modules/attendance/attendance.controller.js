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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const attendance_service_1 = require("./attendance.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    findAll(query, user) {
        return this.attendanceService.findAll(query, user);
    }
    getCalendar(id, month, year) {
        return this.attendanceService.getCalendar(id, parseInt(month, 10), parseInt(year, 10));
    }
    getSummary(id, month, year) {
        return this.attendanceService.getSummary(id, parseInt(month, 10), parseInt(year, 10));
    }
    bulkUpsert(body) {
        return this.attendanceService.bulkUpsert(body.date, body.records);
    }
    correct(id, body, userId) {
        return this.attendanceService.correct(id, body, userId);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List attendance records (role-scoped)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('calendar/:employeeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendance calendar for month' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getCalendar", null);
__decorate([
    (0, common_1.Get)('summary/:employeeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendance summary for month' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('attendance:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk create/update attendance' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "bulkUpsert", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('attendance:manage'),
    (0, audit_decorator_1.Audit)('ATTENDANCE_CORRECTED'),
    (0, swagger_1.ApiOperation)({ summary: 'Correct attendance record' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "correct", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('Attendance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('attendance'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map