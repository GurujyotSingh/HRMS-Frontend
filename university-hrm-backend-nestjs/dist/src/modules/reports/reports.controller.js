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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
let ReportsController = class ReportsController {
    constructor(svc) {
        this.svc = svc;
    }
    attendance(q) { return this.svc.attendanceReport(q); }
    leave(q) { return this.svc.leaveReport(q); }
    headcount(q) { return this.svc.headcountReport(q); }
    payroll(q) { return this.svc.payrollReport(q); }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('attendance'),
    (0, permissions_decorator_1.RequirePermission)('reports:view_all', 'reports:view_department'),
    (0, swagger_1.ApiOperation)({ summary: 'Attendance report' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "attendance", null);
__decorate([
    (0, common_1.Get)('leave'),
    (0, permissions_decorator_1.RequirePermission)('reports:view_all', 'reports:view_department'),
    (0, swagger_1.ApiOperation)({ summary: 'Leave report' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "leave", null);
__decorate([
    (0, common_1.Get)('headcount'),
    (0, permissions_decorator_1.RequirePermission)('reports:view_all', 'reports:view_department'),
    (0, swagger_1.ApiOperation)({ summary: 'Headcount report' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "headcount", null);
__decorate([
    (0, common_1.Get)('payroll'),
    (0, permissions_decorator_1.RequirePermission)('payroll:view_all'),
    (0, swagger_1.ApiOperation)({ summary: 'Payroll report' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "payroll", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('Reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map