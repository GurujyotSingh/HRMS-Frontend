import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    return this.prisma.systemSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    });
  }

  async update(data: Record<string, unknown>) {
    const updateData: Record<string, unknown> = {};
    if (data.workStartTime !== undefined) updateData.workStartTime = data.workStartTime;
    if (data.workEndTime !== undefined) updateData.workEndTime = data.workEndTime;
    if (data.lateThresholdMinutes !== undefined) updateData.lateThresholdMinutes = data.lateThresholdMinutes;
    if (data.workingDays !== undefined) updateData.workingDays = data.workingDays;
    if (data.leaveCarryForwardMax !== undefined) updateData.leaveCarryForwardMax = data.leaveCarryForwardMax;
    if (data.payrollCycleDay !== undefined) updateData.payrollCycleDay = data.payrollCycleDay;
    if (data.aiEnabled !== undefined) updateData.aiEnabled = data.aiEnabled;
    if (data.aiSystemPrompt !== undefined) updateData.aiSystemPrompt = data.aiSystemPrompt;
    return this.prisma.systemSettings.update({ where: { id: 'singleton' }, data: updateData });
  }
}
