import { PrismaService } from '../../prisma/prisma.service';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    get(): Promise<{
        id: string;
        workStartTime: string;
        workEndTime: string;
        lateThresholdMinutes: number;
        workingDays: number[];
        leaveCarryForwardMax: number;
        payrollCycleDay: number;
        aiEnabled: boolean;
        aiSystemPrompt: string | null;
        updatedAt: Date;
    }>;
    update(data: Record<string, unknown>): Promise<{
        id: string;
        workStartTime: string;
        workEndTime: string;
        lateThresholdMinutes: number;
        workingDays: number[];
        leaveCarryForwardMax: number;
        payrollCycleDay: number;
        aiEnabled: boolean;
        aiSystemPrompt: string | null;
        updatedAt: Date;
    }>;
}
