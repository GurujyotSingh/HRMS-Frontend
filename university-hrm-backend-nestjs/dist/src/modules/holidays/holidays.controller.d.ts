import { HolidaysService } from './holidays.service';
export declare class HolidaysController {
    private svc;
    constructor(svc: HolidaysService);
    findAll(year?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        date: Date;
        type: import(".prisma/client").$Enums.HolidayType;
        isOptional: boolean;
    }[]>;
    create(body: Record<string, unknown>): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        date: Date;
        type: import(".prisma/client").$Enums.HolidayType;
        isOptional: boolean;
    }>;
    update(id: string, body: Record<string, unknown>): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        date: Date;
        type: import(".prisma/client").$Enums.HolidayType;
        isOptional: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        date: Date;
        type: import(".prisma/client").$Enums.HolidayType;
        isOptional: boolean;
    }>;
}
