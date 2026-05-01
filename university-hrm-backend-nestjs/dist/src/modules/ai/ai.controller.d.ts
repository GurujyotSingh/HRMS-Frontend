import { AiService } from './ai.service';
export declare class AiController {
    private svc;
    constructor(svc: AiService);
    chat(body: {
        message: string;
        conversationId?: string;
    }, userId: string): Promise<{
        response: string;
        conversationId?: undefined;
    } | {
        conversationId: string;
        response: string;
    }>;
    getConversations(userId: string): Promise<{
        id: string;
        messages: import("@prisma/client/runtime/library").JsonValue[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getConversation(id: string): Promise<{
        id: string;
        userId: string;
        messages: import("@prisma/client/runtime/library").JsonValue[];
        context: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    deleteConversation(id: string): Promise<{
        id: string;
        userId: string;
        messages: import("@prisma/client/runtime/library").JsonValue[];
        context: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
