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
exports.HolidaysService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let HolidaysService = class HolidaysService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(year) {
        const y = year || new Date().getFullYear();
        return this.prisma.holiday.findMany({
            where: { date: { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) } },
            orderBy: { date: 'asc' },
        });
    }
    async create(data) {
        return this.prisma.holiday.create({ data: { name: data.name, date: new Date(data.date), type: data.type, isOptional: data.isOptional || false } });
    }
    async update(id, data) {
        const updateData = {};
        if (data.name)
            updateData.name = data.name;
        if (data.date)
            updateData.date = new Date(data.date);
        if (data.type)
            updateData.type = data.type;
        if (data.isOptional !== undefined)
            updateData.isOptional = data.isOptional;
        return this.prisma.holiday.update({ where: { id }, data: updateData });
    }
    async remove(id) { return this.prisma.holiday.delete({ where: { id } }); }
};
exports.HolidaysService = HolidaysService;
exports.HolidaysService = HolidaysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HolidaysService);
//# sourceMappingURL=holidays.service.js.map