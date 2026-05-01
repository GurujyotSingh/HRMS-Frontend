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
exports.AnnouncementsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const announcements_service_1 = require("./announcements.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
let AnnouncementsController = class AnnouncementsController {
    constructor(svc) {
        this.svc = svc;
    }
    findAll(q, u) { return this.svc.findAll(q, u); }
    create(body, userId) { return this.svc.create(body, userId); }
    markRead(id, userId) { return this.svc.markRead(id, userId); }
    remove(id) { return this.svc.remove(id); }
};
exports.AnnouncementsController = AnnouncementsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List announcements' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('announcements:manage', 'announcements:create_department', 'announcements:create_general'),
    (0, audit_decorator_1.Audit)('ANNOUNCEMENT_CREATED'),
    (0, swagger_1.ApiOperation)({ summary: 'Create announcement' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark announcement as read' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "markRead", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermission)('announcements:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete announcement' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "remove", null);
exports.AnnouncementsController = AnnouncementsController = __decorate([
    (0, swagger_1.ApiTags)('Announcements'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('announcements'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    __metadata("design:paramtypes", [announcements_service_1.AnnouncementsService])
], AnnouncementsController);
//# sourceMappingURL=announcements.controller.js.map