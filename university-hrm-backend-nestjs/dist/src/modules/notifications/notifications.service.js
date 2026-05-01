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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
const notifications_gateway_1 = require("./notifications.gateway");
let NotificationsService = class NotificationsService {
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async findAll(userId, query) {
        const where = { userId };
        if (query.isRead !== undefined)
            where.isRead = query.isRead === 'true';
        if (query.type)
            where.type = query.type;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const [data, total] = await Promise.all([
            this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            this.prisma.notification.count({ where }),
        ]);
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async create(userId, type, title, message, link) {
        const notification = await this.prisma.notification.create({
            data: { userId, type, title, message, link },
        });
        this.gateway.sendToUser(userId, notification);
        return notification;
    }
    async markRead(id) { return this.prisma.notification.update({ where: { id }, data: { isRead: true } }); }
    async markAllRead(userId) {
        await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
        return { message: 'All notifications marked as read' };
    }
    async remove(id) { return this.prisma.notification.delete({ where: { id } }); }
    async getUnreadCount(userId) {
        return { count: await this.prisma.notification.count({ where: { userId, isRead: false } }) };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, notifications_gateway_1.NotificationsGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map