import { OnboardingService } from './onboarding.service';
export declare class OnboardingController {
    private onboardingService;
    constructor(onboardingService: OnboardingService);
    findAll(query: Record<string, string>): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
        employee: {
            id: string;
            department: {
                name: string;
            } | null;
            employeeId: string;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
        };
        tasks: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TaskStatus;
            title: string;
            priority: import(".prisma/client").$Enums.TaskPriority;
            description: string | null;
            completedAt: Date | null;
            dueDate: Date;
            order: number;
            onboardingId: string;
            assignedToId: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.OnboardingStatus;
        startDate: Date;
        expectedCompletionDate: Date;
        completedAt: Date | null;
    }>>;
    findOne(id: string): Promise<{
        employee: {
            id: string;
            department: {
                name: string;
            } | null;
            employeeId: string;
            firstName: string;
            lastName: string;
        };
        tasks: ({
            assignedTo: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TaskStatus;
            title: string;
            priority: import(".prisma/client").$Enums.TaskPriority;
            description: string | null;
            completedAt: Date | null;
            dueDate: Date;
            order: number;
            onboardingId: string;
            assignedToId: string;
        })[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.OnboardingStatus;
        startDate: Date;
        expectedCompletionDate: Date;
        completedAt: Date | null;
    }>;
    findByEmployee(id: string): Promise<({
        tasks: ({
            assignedTo: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TaskStatus;
            title: string;
            priority: import(".prisma/client").$Enums.TaskPriority;
            description: string | null;
            completedAt: Date | null;
            dueDate: Date;
            order: number;
            onboardingId: string;
            assignedToId: string;
        })[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.OnboardingStatus;
        startDate: Date;
        expectedCompletionDate: Date;
        completedAt: Date | null;
    }) | null>;
    create(body: Record<string, unknown>): Promise<{
        tasks: {
            id: string;
            updatedAt: Date;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TaskStatus;
            title: string;
            priority: import(".prisma/client").$Enums.TaskPriority;
            description: string | null;
            completedAt: Date | null;
            dueDate: Date;
            order: number;
            onboardingId: string;
            assignedToId: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.OnboardingStatus;
        startDate: Date;
        expectedCompletionDate: Date;
        completedAt: Date | null;
    }>;
    addTask(id: string, body: Record<string, unknown>): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TaskStatus;
        title: string;
        priority: import(".prisma/client").$Enums.TaskPriority;
        description: string | null;
        completedAt: Date | null;
        dueDate: Date;
        order: number;
        onboardingId: string;
        assignedToId: string;
    }>;
    reorderTasks(body: {
        taskIds: string[];
    }): Promise<{
        reordered: number;
    }>;
    updateTask(id: string, body: Record<string, unknown>): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TaskStatus;
        title: string;
        priority: import(".prisma/client").$Enums.TaskPriority;
        description: string | null;
        completedAt: Date | null;
        dueDate: Date;
        order: number;
        onboardingId: string;
        assignedToId: string;
    }>;
    deleteTask(id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TaskStatus;
        title: string;
        priority: import(".prisma/client").$Enums.TaskPriority;
        description: string | null;
        completedAt: Date | null;
        dueDate: Date;
        order: number;
        onboardingId: string;
        assignedToId: string;
    }>;
}
