import { PrismaService } from '../../prisma/prisma.service';
export declare class OnboardingService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: Record<string, unknown>): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
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
    findByEmployee(employeeId: string): Promise<({
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
    create(data: {
        employeeId: string;
        startDate: string;
        expectedCompletionDate: string;
        tasks?: Array<{
            title: string;
            description?: string;
            assignedToId: string;
            dueDate: string;
            priority?: string;
        }>;
    }): Promise<{
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
    addTask(onboardingId: string, data: {
        title: string;
        description?: string;
        assignedToId: string;
        dueDate: string;
        priority?: string;
    }): Promise<{
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
    updateTask(taskId: string, data: Record<string, unknown>): Promise<{
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
    reorderTasks(taskIds: string[]): Promise<{
        reordered: number;
    }>;
    deleteTask(taskId: string): Promise<{
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
