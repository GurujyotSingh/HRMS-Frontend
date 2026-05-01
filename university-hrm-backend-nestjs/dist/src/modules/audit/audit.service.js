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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.userId)
            where.userId = query.userId;
        if (query.action)
            where.action = query.action;
        if (query.targetType)
            where.targetType = query.targetType;
        if (query.fromDate)
            where.createdAt = { gte: new Date(query.fromDate) };
        if (query.toDate)
            where.createdAt = { ...where.createdAt, lte: new Date(query.toDate) };
        if (query.search) {
            where.OR = [
                { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
                { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
                { user: { email: { contains: query.search, mode: 'insensitive' } } },
            ];
        }
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: { user: { select: { firstName: true, lastName: true, email: true, role: true, profilePhoto: true } } },
                orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map