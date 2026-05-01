import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async chat(userId: string, message: string, conversationId?: string) {
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
    if (!settings?.aiEnabled) {
      return { response: 'AI assistant is currently disabled. Please contact HR to enable it.' };
    }

    const apiKey = this.config.get<string>('ai.apiKey');
    if (!apiKey) {
      return { response: 'AI is not configured. Please set the AI_API_KEY environment variable.' };
    }

    // Load or create conversation
    let conversation: { id: string; messages: unknown[] };
    if (conversationId) {
      const existing = await this.prisma.aIConversation.findFirst({ where: { id: conversationId, userId } });
      conversation = existing ? { id: existing.id, messages: existing.messages as unknown[] } : { id: '', messages: [] };
    } else {
      conversation = { id: '', messages: [] };
    }

    // Add user message
    const userMessage = { role: 'user', content: message };
    conversation.messages.push(userMessage);

    // Get user context for personalized responses
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, role: true, designation: true, department: { select: { name: true } } },
    });

    const systemPrompt = settings.aiSystemPrompt || `You are an HR assistant for a University HRMS. The user is ${user?.firstName} ${user?.lastName}, a ${user?.designation || user?.role} in the ${user?.department?.name || 'Unknown'} department. Help them with HR-related queries such as leave policies, payroll questions, onboarding tasks, and general HR guidance. Be professional, friendly, and concise.`;

    // Call AI API (Groq / OpenAI compatible)
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.get<string>('ai.model') || 'llama3-70b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversation.messages.slice(-20),
          ],
        }),
      });

      const data = await response.json() as { choices?: Array<{ message: { content: string } }>; error?: { message: string } };
      const assistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';
      conversation.messages.push({ role: 'assistant', content: assistantMessage });

      // Save conversation
      if (conversation.id) {
        await this.prisma.aIConversation.update({
          where: { id: conversation.id },
          data: { messages: conversation.messages as object[] },
        });
      } else {
        const created = await this.prisma.aIConversation.create({
          data: { userId, messages: conversation.messages as object[] },
        });
        conversation.id = created.id;
      }

      return { conversationId: conversation.id, response: assistantMessage };
    } catch (err) {
      return { response: 'AI service is temporarily unavailable. Please try again later.' };
    }
  }

  async getConversations(userId: string) {
    return this.prisma.aIConversation.findMany({
      where: { userId },
      select: { id: true, messages: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  async getConversation(id: string) {
    return this.prisma.aIConversation.findUnique({ where: { id } });
  }

  async deleteConversation(id: string) {
    return this.prisma.aIConversation.delete({ where: { id } });
  }
}
