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
exports.AnnouncementsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
let AnnouncementsService = class AnnouncementsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, currentUser) {
        const where = {
            OR: [
                { targetRoles: { has: currentUser.role } },
                { targetRoles: { isEmpty: true } },
            ],
        };
        if (query.priority) {
            where.priority = query.priority;
        }
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const [data, total] = await Promise.all([
            this.prisma.announcement.findMany({
                where,
                include: {
                    author: { select: { firstName: true, lastName: true, profilePhoto: true } },
                    reads: { where: { userId: currentUser.sub }, select: { id: true } },
                },
                orderBy: { publishedAt: 'desc' },
                skip: (page - 1) * limit, take: limit,
            }),
            this.prisma.announcement.count({ where }),
        ]);
        const mapped = data.map(a => ({ ...a, isRead: a.reads.length > 0, reads: undefined }));
        return (0, pagination_util_1.paginate)(mapped, total, page, limit);
    }
    async create(data, authorId) {
        return this.prisma.announcement.create({
            data: {
                title: data.title, body: data.body, authorId,
                targetRoles: data.targetRoles || [],
                targetDepartments: data.targetDepartments || [],
                priority: data.priority || 'NORMAL',
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            },
        });
    }
    async markRead(announcementId, userId) {
        return this.prisma.announcementRead.upsert({
            where: { announcementId_userId: { announcementId, userId } },
            create: { announcementId, userId },
            update: {},
        });
    }
    async remove(id) { return this.prisma.announcement.delete({ where: { id } }); }
};
exports.AnnouncementsService = AnnouncementsService;
exports.AnnouncementsService = AnnouncementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnnouncementsService);
//# sourceMappingURL=announcements.service.js.map