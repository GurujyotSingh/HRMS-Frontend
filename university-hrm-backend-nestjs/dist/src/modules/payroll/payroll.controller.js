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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payroll_service_1 = require("./payroll.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
const client_1 = require("@prisma/client");
let PayrollController = class PayrollController {
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    findAll(query, user) {
        return this.payrollService.findAll(query, user);
    }
    getSummary(month, year) {
        return this.payrollService.getSummary(Number(month), Number(year));
    }
    findOne(id) { return this.payrollService.findOne(id); }
    generate(body) {
        return this.payrollService.generate(body);
    }
    publish(id) { return this.payrollService.publish(id); }
    getSalaryStructure(employeeId) {
        return this.payrollService.getSalaryStructure(employeeId);
    }
    setSalaryStructure(employeeId, body) {
        return this.payrollService.setSalaryStructure(employeeId, {
            basicSalary: Number(body.basicSalary),
            hra: Number(body.hra || 0),
            ta: Number(body.ta || 0),
            da: Number(body.da || 0),
            otherAllowances: Number(body.otherAllowances || 0),
            pfDeduction: Number(body.pfDeduction || 0),
            professionalTax: Number(body.professionalTax || 0),
            tdsRate: Number(body.tdsRate || 0),
            workingDaysPerMonth: Number(body.workingDaysPerMonth || 26),
        });
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List payslips (role-scoped)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.HR_MANAGER, client_1.SystemRole.HR_STAFF, client_1.SystemRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get payroll summary for a month' }),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payslip by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.HR_MANAGER, client_1.SystemRole.SUPER_ADMIN),
    (0, audit_decorator_1.Audit)('PAYSLIP_GENERATED'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate payslips for one employee or all' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "generate", null);
__decorate([
    (0, common_1.Patch)(':id/publish'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.HR_MANAGER, client_1.SystemRole.SUPER_ADMIN),
    (0, audit_decorator_1.Audit)('PAYSLIP_PUBLISHED'),
    (0, swagger_1.ApiOperation)({ summary: 'Publish (finalize) a payslip so employee can view it' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "publish", null);
__decorate([
    (0, common_1.Get)('salary-structure/:employeeId'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.HR_MANAGER, client_1.SystemRole.HR_STAFF, client_1.SystemRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get salary structure for an employee' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getSalaryStructure", null);
__decorate([
    (0, common_1.Post)('salary-structure/:employeeId'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.HR_MANAGER, client_1.SystemRole.SUPER_ADMIN),
    (0, audit_decorator_1.Audit)('PAYSLIP_GENERATED'),
    (0, swagger_1.ApiOperation)({ summary: 'Set/update salary structure for an employee' }),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "setSalaryStructure", null);
exports.PayrollController = PayrollController = __decorate([
    (0, swagger_1.ApiTags)('Payroll'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('payroll'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map