import { PrismaService } from '../../prisma/prisma.service';
import { HolidayType } from '@prisma/client';
export declare class HolidaysService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(year?: number): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        date: Date;
        type: import(".prisma/client").$Enums.HolidayType;
        isOptional: boolean;
    }[]>;
    create(data: {
        name: string;
        date: string;
        type: HolidayType;
        isOptional?: boolean;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        date: Date;
        type: import(".prisma/client").$Enums.HolidayType;
        isOptional: boolean;
    }>;
    update(id: string, data: Record<string, unknown>): Promise<{
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
