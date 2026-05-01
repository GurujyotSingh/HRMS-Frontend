import { Controller, Get, Patch, Delete, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Notifications') @ApiBearerAuth() @Controller('notifications') @UseInterceptors(AuditLogInterceptor)
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get() @ApiOperation({ summary: 'List notifications' })
  findAll(@CurrentUser('sub') userId: string, @Query() q: Record<string, string>) { return this.svc.findAll(userId, q); }

  @Get('unread-count') @ApiOperation({ summary: 'Get unread count' })
  unreadCount(@CurrentUser('sub') userId: string) { return this.svc.getUnreadCount(userId); }

  @Patch(':id/read') @ApiOperation({ summary: 'Mark as read' })
  markRead(@Param('id') id: string) { return this.svc.markRead(id); }

  @Patch('read-all') @ApiOperation({ summary: 'Mark all as read' })
  markAllRead(@CurrentUser('sub') userId: string) { return this.svc.markAllRead(userId); }

  @Delete(':id') @ApiOperation({ summary: 'Delete notification' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
