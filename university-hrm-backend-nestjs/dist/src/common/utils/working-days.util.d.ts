import { PrismaService } from '../../prisma/prisma.service';
export declare function isWeekend(date: Date, workingDays?: number[]): boolean;
export declare function calculateWorkingDays(prisma: PrismaService, fromDate: Date, toDate: Date, workingDays?: number[]): Promise<number>;
export declare function getDateRange(from: Date, to: Date): Date[];
