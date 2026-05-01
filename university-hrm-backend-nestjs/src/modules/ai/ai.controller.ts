import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('AI') @ApiBearerAuth() @Controller('ai')
export class AiController {
  constructor(private svc: AiService) {}

  @Post('chat') @ApiOperation({ summary: 'Chat with AI assistant' })
  chat(@Body() body: { message: string; conversationId?: string }, @CurrentUser('sub') userId: string) {
    return this.svc.chat(userId, body.message, body.conversationId);
  }

  @Get('conversations') @ApiOperation({ summary: 'List conversations' })
  getConversations(@CurrentUser('sub') userId: string) { return this.svc.getConversations(userId); }

  @Get('conversations/:id') @ApiOperation({ summary: 'Get conversation' })
  getConversation(@Param('id') id: string) { return this.svc.getConversation(id); }

  @Delete('conversations/:id') @ApiOperation({ summary: 'Delete conversation' })
  deleteConversation(@Param('id') id: string) { return this.svc.deleteConversation(id); }
}
