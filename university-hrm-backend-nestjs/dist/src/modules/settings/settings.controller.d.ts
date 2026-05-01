import { SettingsService } from './settings.service';
export declare class SettingsController {
    private svc;
    constructor(svc: SettingsService);
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
    update(body: Record<string, unknown>): Promise<{
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
