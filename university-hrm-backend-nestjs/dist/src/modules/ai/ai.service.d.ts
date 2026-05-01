import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class AiService {
    private prisma;
    private config;
    constructor(prisma: PrismaService, config: ConfigService);
    chat(userId: string, message: string, conversationId?: string): Promise<{
        response: string;
        conversationId?: undefined;
    } | {
        conversationId: string;
        response: string;
    }>;
    getConversations(userId: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        messages: import("@prisma/client/runtime/library").JsonValue[];
    }[]>;
    getConversation(id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
        messages: import("@prisma/client/runtime/library").JsonValue[];
        context: import("@prisma/client/runtime/library").JsonValue | null;
    } | null>;
    deleteConversation(id: string): Promise<{
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string;
        messages: import("@prisma/client/runtime/library").JsonValue[];
        context: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
