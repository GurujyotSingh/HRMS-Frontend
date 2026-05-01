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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get() {
        return this.prisma.systemSettings.upsert({
            where: { id: 'singleton' },
            create: { id: 'singleton' },
            update: {},
        });
    }
    async update(data) {
        const updateData = {};
        if (data.workStartTime !== undefined)
            updateData.workStartTime = data.workStartTime;
        if (data.workEndTime !== undefined)
            updateData.workEndTime = data.workEndTime;
        if (data.lateThresholdMinutes !== undefined)
            updateData.lateThresholdMinutes = data.lateThresholdMinutes;
        if (data.workingDays !== undefined)
            updateData.workingDays = data.workingDays;
        if (data.leaveCarryForwardMax !== undefined)
            updateData.leaveCarryForwardMax = data.leaveCarryForwardMax;
        if (data.payrollCycleDay !== undefined)
            updateData.payrollCycleDay = data.payrollCycleDay;
        if (data.aiEnabled !== undefined)
            updateData.aiEnabled = data.aiEnabled;
        if (data.aiSystemPrompt !== undefined)
            updateData.aiSystemPrompt = data.aiSystemPrompt;
        return this.prisma.systemSettings.update({ where: { id: 'singleton' }, data: updateData });
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map