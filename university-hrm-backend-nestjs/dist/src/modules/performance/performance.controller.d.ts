import { PerformanceService } from './performance.service';
export declare class PerformanceController {
    private readonly svc;
    constructor(svc: PerformanceService);
    createCycle(body: Record<string, unknown>): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.CycleStatus;
        year: number;
        title: string;
        startDate: Date;
        endDate: Date;
    }>;
    getCycles(): Promise<({
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
    myGoals(user: {
        sub: string;
    }): Promise<({
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
    createGoal(user: {
        sub: string;
    }, body: Record<string, unknown>): Promise<{
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
    submitGoal(id: string, user: {
        sub: string;
    }): Promise<{
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
    selfReview(id: string, user: {
        sub: string;
    }, body: Record<string, unknown>): Promise<{
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
    directorPending(user: {
        sub: string;
        departmentId: string | null;
    }): Promise<({
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
    directorReview(id: string, user: {
        sub: string;
        departmentId: string | null;
    }, body: Record<string, unknown>): Promise<{
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
    assignGoal(user: {
        sub: string;
        departmentId: string | null;
    }, body: Record<string, unknown>): Promise<{
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
    hrFinalize(id: string, user: {
        sub: string;
    }, body: Record<string, unknown>): Promise<{
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
