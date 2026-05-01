"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
let AiService = class AiService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async chat(userId, message, conversationId) {
        const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
        if (!settings?.aiEnabled) {
            return { response: 'AI assistant is currently disabled. Please contact HR to enable it.' };
        }
        const apiKey = this.config.get('ai.apiKey');
        if (!apiKey) {
            return { response: 'AI is not configured. Please set the AI_API_KEY environment variable.' };
        }
        let conversation;
        if (conversationId) {
            const existing = await this.prisma.aIConversation.findFirst({ where: { id: conversationId, userId } });
            conversation = existing ? { id: existing.id, messages: existing.messages } : { id: '', messages: [] };
        }
        else {
            conversation = { id: '', messages: [] };
        }
        const userMessage = { role: 'user', content: message };
        conversation.messages.push(userMessage);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, role: true, designation: true, department: { select: { name: true } } },
        });
        const systemPrompt = settings.aiSystemPrompt || `You are an HR assistant for a University HRMS. The user is ${user?.firstName} ${user?.lastName}, a ${user?.designation || user?.role} in the ${user?.department?.name || 'Unknown'} department. Help them with HR-related queries such as leave policies, payroll questions, onboarding tasks, and general HR guidance. Be professional, friendly, and concise.`;
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: this.config.get('ai.model') || 'llama3-70b-8192',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...conversation.messages.slice(-20),
                    ],
                }),
            });
            const data = await response.json();
            const assistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';
            conversation.messages.push({ role: 'assistant', content: assistantMessage });
            if (conversation.id) {
                await this.prisma.aIConversation.update({
                    where: { id: conversation.id },
                    data: { messages: conversation.messages },
                });
            }
            else {
                const created = await this.prisma.aIConversation.create({
                    data: { userId, messages: conversation.messages },
                });
                conversation.id = created.id;
            }
            return { conversationId: conversation.id, response: assistantMessage };
        }
        catch (err) {
            return { response: 'AI service is temporarily unavailable. Please try again later.' };
        }
    }
    async getConversations(userId) {
        return this.prisma.aIConversation.findMany({
            where: { userId },
            select: { id: true, messages: true, createdAt: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 20,
        });
    }
    async getConversation(id) {
        return this.prisma.aIConversation.findUnique({ where: { id } });
    }
    async deleteConversation(id) {
        return this.prisma.aIConversation.delete({ where: { id } });
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map