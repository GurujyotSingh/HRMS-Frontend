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
exports.PerformanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const performance_service_1 = require("./performance.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let PerformanceController = class PerformanceController {
    constructor(svc) {
        this.svc = svc;
    }
    createCycle(body) {
        return this.svc.createCycle(body);
    }
    getCycles() {
        return this.svc.getAllCycles();
    }
    getActiveCycle() {
        return this.svc.getActiveCycle();
    }
    closeCycle(id) {
        return this.svc.closeCycle(id);
    }
    myGoals(user) {
        return this.svc.getMyGoals(user.sub);
    }
    createGoal(user, body) {
        return this.svc.createGoal(user.sub, body);
    }
    submitGoal(id, user) {
        return this.svc.submitGoal(id, user.sub);
    }
    selfReview(id, user, body) {
        return this.svc.selfReview(id, user.sub, body);
    }
    directorPending(user) {
        return this.svc.getDirectorPendingGoals(user.departmentId);
    }
    directorReview(id, user, body) {
        return this.svc.directorReview(id, user.sub, user.departmentId, body);
    }
    assignGoal(user, body) {
        return this.svc.assignGoal(user.sub, user.departmentId, body);
    }
    getAllGoals(cycleId) {
        return this.svc.getAllGoals(cycleId);
    }
    hrFinalize(id, user, body) {
        return this.svc.hrFinalize(id, user.sub, body);
    }
};
exports.PerformanceController = PerformanceController;
__decorate([
    (0, common_1.Post)('cycles'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.HR_MANAGER, client_1.SystemRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'HR: create appraisal cycle' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "createCycle", null);
__decorate([
    (0, common_1.Get)('cycles'),
    (0, swagger_1.ApiOperation)({ summary: 'List all appraisal cycles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "getCycles", null);
__decorate([
    (0, common_1.Get)('cycles/active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current active cycle' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "getActiveCycle", null);
__decorate([
    (0, common_1.Patch)('cycles/:id/close'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.HR_MANAGER, client_1.SystemRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'HR: close an appraisal cycle' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "closeCycle", null);
__decorate([
    (0, common_1.Get)('goals/my'),
    (0, swagger_1.ApiOperation)({ summary: 'Employee: view own goals' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "myGoals", null);
__decorate([
    (0, common_1.Post)('goals'),
    (0, swagger_1.ApiOperation)({ summary: 'Employee: set goals for active cycle' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "createGoal", null);
__decorate([
    (0, common_1.Patch)('goals/:id/submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Employee: submit goals for Director review' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "submitGoal", null);
__decorate([
    (0, common_1.Patch)('goals/:id/self-review'),
    (0, swagger_1.ApiOperation)({ summary: 'Employee: submit self-rating' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "selfReview", null);
__decorate([
    (0, common_1.Get)('goals/director/pending'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.DIRECTOR),
    (0, swagger_1.ApiOperation)({ summary: 'Director: view submitted goals in department' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "directorPending", null);
__decorate([
    (0, common_1.Patch)('goals/:id/director-review'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.DIRECTOR),
    (0, swagger_1.ApiOperation)({ summary: 'Director: rate and review a goal' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "directorReview", null);
__decorate([
    (0, common_1.Post)('goals/assign'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.DIRECTOR),
    (0, swagger_1.ApiOperation)({ summary: 'Director: assign goal to an employee' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "assignGoal", null);
__decorate([
    (0, common_1.Get)('goals'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.HR_MANAGER, client_1.SystemRole.HR_STAFF, client_1.SystemRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'HR: view all goals' }),
    __param(0, (0, common_1.Query)('cycleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "getAllGoals", null);
__decorate([
    (0, common_1.Patch)('goals/:id/finalize'),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.HR_MANAGER, client_1.SystemRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'HR: set final rating' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PerformanceController.prototype, "hrFinalize", null);
exports.PerformanceController = PerformanceController = __decorate([
    (0, swagger_1.ApiTags)('Performance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('performance'),
    __metadata("design:paramtypes", [performance_service_1.PerformanceService])
], PerformanceController);
//# sourceMappingURL=performance.controller.js.map