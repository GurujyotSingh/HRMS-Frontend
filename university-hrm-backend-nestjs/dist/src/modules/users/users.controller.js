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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const user_dto_1 = require("./dto/user.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
const client_1 = require("@prisma/client");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    findAll(query, user) {
        return this.usersService.findAll(query, user);
    }
    generateEmployeeId() {
        return this.usersService.generateNextEmployeeId();
    }
    findOne(id, user) {
        return this.usersService.findOne(id, user);
    }
    getStats(id) {
        return this.usersService.getStats(id);
    }
    create(dto) {
        return this.usersService.create(dto);
    }
    update(id, dto, user) {
        return this.usersService.update(id, dto, user);
    }
    changeRole(id, dto) {
        return this.usersService.changeRole(id, dto.role);
    }
    changeStatus(id, dto) {
        return this.usersService.changeStatus(id, dto.status, dto.reason);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List users (role-scoped)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.QueryUsersDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('generate-employee-id'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('employees:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate next employee ID' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "generateEmployeeId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID (role-scoped)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user statistics' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('employees:create'),
    (0, audit_decorator_1.Audit)('EMPLOYEE_CREATED'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new employee' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, audit_decorator_1.Audit)('EMPLOYEE_UPDATED'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (role-scoped field access)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.SUPER_ADMIN),
    (0, audit_decorator_1.Audit)('ROLE_CHANGED'),
    (0, swagger_1.ApiOperation)({ summary: 'Change user role (SUPER_ADMIN only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.ChangeRoleDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changeRole", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('employees:deactivate'),
    (0, audit_decorator_1.Audit)('EMPLOYEE_DEACTIVATED'),
    (0, swagger_1.ApiOperation)({ summary: 'Change user status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.ChangeStatusDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changeStatus", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('users'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map