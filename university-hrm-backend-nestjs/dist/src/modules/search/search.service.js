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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SearchService = class SearchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async globalSearch(query, currentUser) {
        if (!query || query.length < 2)
            return { employees: [], departments: [], announcements: [] };
        const deptFilter = (currentUser.role === 'DIRECTOR') ? { departmentId: currentUser.departmentId } : {};
        const [employees, departments, announcements] = await Promise.all([
            this.prisma.user.findMany({
                where: {
                    ...deptFilter,
                    OR: [
                        { firstName: { contains: query, mode: 'insensitive' } },
                        { lastName: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                        { employeeId: { contains: query, mode: 'insensitive' } },
                        { designation: { contains: query, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, employeeId: true, firstName: true, lastName: true, email: true, role: true, designation: true, department: { select: { name: true } }, profilePhoto: true },
                take: 10,
            }),
            this.prisma.department.findMany({
                where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { code: { contains: query, mode: 'insensitive' } }] },
                select: { id: true, name: true, code: true },
                take: 5,
            }),
            this.prisma.announcement.findMany({
                where: { OR: [{ title: { contains: query, mode: 'insensitive' } }, { body: { contains: query, mode: 'insensitive' } }] },
                select: { id: true, title: true, priority: true, publishedAt: true },
                orderBy: { publishedAt: 'desc' },
                take: 5,
            }),
        ]);
        return { employees, departments, announcements };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map