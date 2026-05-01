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
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const core_1 = require("@nestjs/core");
const audit_decorator_1 = require("../decorators/audit.decorator");
const prisma_service_1 = require("../../prisma/prisma.service");
const SENSITIVE_FIELDS = ['passwordHash', 'password', 'token', 'refreshToken', 'resetToken'];
function sanitize(obj) {
    if (!obj || typeof obj !== 'object')
        return obj;
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_FIELDS.includes(key)) {
            clean[key] = '[REDACTED]';
        }
        else {
            clean[key] = value;
        }
    }
    return clean;
}
let AuditLogInterceptor = class AuditLogInterceptor {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    intercept(context, next) {
        const action = this.reflector.get(audit_decorator_1.AUDIT_KEY, context.getHandler());
        if (!action) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        return next.handle().pipe((0, rxjs_1.tap)((responseData) => {
            const userId = request.user?.sub || request.user?.id;
            if (!userId)
                return;
            const targetId = request.params?.id ||
                responseData?.id ||
                null;
            this.prisma.auditLog
                .create({
                data: {
                    userId,
                    action,
                    targetId: targetId ? String(targetId) : null,
                    targetType: context.getClass().name.replace('Controller', ''),
                    details: request.body ? sanitize(request.body) : undefined,
                    ipAddress: request.ip || request.connection?.remoteAddress,
                    userAgent: request.headers?.['user-agent'] || null,
                },
            })
                .catch((err) => {
                console.error('Audit log write failed:', err.message);
            });
        }));
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map