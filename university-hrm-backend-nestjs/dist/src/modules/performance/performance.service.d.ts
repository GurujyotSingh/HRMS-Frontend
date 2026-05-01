import { PrismaService } from '../../prisma/prisma.service';
export declare class PerformanceService {
    private prisma;
    constructor(prisma: PrismaService);
    createCycle(data: Record<string, unknown>): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CycleStatus;
        year: number;
        title: string;
        startDate: Date;
        endDate: Date;
    }>;
    getAllCycles(): Promise<({
        _count: {
            goals: number;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CycleStatus;
        year: number;
        title: string;
        startDate: Date;
        endDate: Date;
    })[]>;
    getActiveCycle(): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CycleStatus;
        year: number;
        title: string;
        startDate: Date;
        endDate: Date;
    } | null>;
    closeCycle(id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CycleStatus;
        year: number;
        title: string;
        startDate: Date;
        endDate: Date;
    }>;
    createGoal(employeeId: string, data: Record<string, unknown>): Promise<{
        employee: {
            employeeId: string;
            firstName: string;
            lastName: string;
        };
        cycle: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            status: import(".prisma/client").$Enums.CycleStatus;
            year: number;
            title: string;
            startDate: Date;
            endDate: Date;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        reviewedAt: Date | null;
        reviewedById: string | null;
        goalsText: string;
        selfRating: number | null;
        selfComments: string | null;
        directorRating: number | null;
        directorComments: string | null;
        finalRating: number | null;
        hrComments: string | null;
        finalizedById: string | null;
        finalizedAt: Date | null;
        cycleId: string;
    }>;
    submitGoal(goalId: string, employeeId: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        reviewedAt: Date | null;
        reviewedById: string | null;
        goalsText: string;
        selfRating: number | null;
        selfComments: string | null;
        directorRating: number | null;
        directorComments: string | null;
        finalRating: number | null;
        hrComments: string | null;
        finalizedById: string | null;
        finalizedAt: Date | null;
        cycleId: string;
    }>;
    selfReview(goalId: string, employeeId: string, data: Record<string, unknown>): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        reviewedAt: Date | null;
        reviewedById: string | null;
        goalsText: string;
        selfRating: number | null;
        selfComments: string | null;
        directorRating: number | null;
        directorComments: string | null;
        finalRating: number | null;
        hrComments: string | null;
        finalizedById: string | null;
        finalizedAt: Date | null;
        cycleId: string;
    }>;
    getMyGoals(employeeId: string): Promise<({
        cycle: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            status: import(".prisma/client").$Enums.CycleStatus;
            year: number;
            title: string;
            startDate: Date;
            endDate: Date;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        reviewedAt: Date | null;
        reviewedById: string | null;
        goalsText: string;
        selfRating: number | null;
        selfComments: string | null;
        directorRating: number | null;
        directorComments: string | null;
        finalRating: number | null;
        hrComments: string | null;
        finalizedById: string | null;
        finalizedAt: Date | null;
        cycleId: string;
    })[]>;
    getDirectorPendingGoals(departmentId: string): Promise<({
        employee: {
            id: string;
            employeeId: string;
            firstName: string;
            lastName: string;
            designation: string | null;
        };
        cycle: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            status: import(".prisma/client").$Enums.CycleStatus;
            year: number;
            title: string;
            startDate: Date;
            endDate: Date;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        reviewedAt: Date | null;
        reviewedById: string | null;
        goalsText: string;
        selfRating: number | null;
        selfComments: string | null;
        directorRating: number | null;
        directorComments: string | null;
        finalRating: number | null;
        hrComments: string | null;
        finalizedById: string | null;
        finalizedAt: Date | null;
        cycleId: string;
    })[]>;
    directorReview(goalId: string, reviewerId: string, departmentId: string, data: Record<string, unknown>): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        reviewedAt: Date | null;
        reviewedById: string | null;
        goalsText: string;
        selfRating: number | null;
        selfComments: string | null;
        directorRating: number | null;
        directorComments: string | null;
        finalRating: number | null;
        hrComments: string | null;
        finalizedById: string | null;
        finalizedAt: Date | null;
        cycleId: string;
    }>;
    assignGoal(directorId: string, departmentId: string, data: Record<string, unknown>): Promise<{
        employee: {
            employeeId: string;
            firstName: string;
            lastName: string;
        };
        cycle: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            status: import(".prisma/client").$Enums.CycleStatus;
            year: number;
            title: string;
            startDate: Date;
            endDate: Date;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        reviewedAt: Date | null;
        reviewedById: string | null;
        goalsText: string;
        selfRating: number | null;
        selfComments: string | null;
        directorRating: number | null;
        directorComments: string | null;
        finalRating: number | null;
        hrComments: string | null;
        finalizedById: string | null;
        finalizedAt: Date | null;
        cycleId: string;
    }>;
    getAllGoals(cycleId?: string): Promise<({
        employee: {
            id: string;
            department: {
                name: string;
            } | null;
            employeeId: string;
            firstName: string;
            lastName: string;
        };
        cycle: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            status: import(".prisma/client").$Enums.CycleStatus;
            year: number;
            title: string;
            startDate: Date;
            endDate: Date;
        };
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        reviewedAt: Date | null;
        reviewedById: string | null;
        goalsText: string;
        selfRating: number | null;
        selfComments: string | null;
        directorRating: number | null;
        directorComments: string | null;
        finalRating: number | null;
        hrComments: string | null;
        finalizedById: string | null;
        finalizedAt: Date | null;
        cycleId: string;
    })[]>;
    hrFinalize(goalId: string, hrId: string, data: Record<string, unknown>): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        reviewedAt: Date | null;
        reviewedById: string | null;
        goalsText: string;
        selfRating: number | null;
        selfComments: string | null;
        directorRating: number | null;
        directorComments: string | null;
        finalRating: number | null;
        hrComments: string | null;
        finalizedById: string | null;
        finalizedAt: Date | null;
        cycleId: string;
    }>;
}
