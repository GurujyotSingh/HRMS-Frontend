import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Announcements') @ApiBearerAuth() @Controller('announcements') @UseInterceptors(AuditLogInterceptor)
export class AnnouncementsController {
  constructor(private svc: AnnouncementsService) {}

  @Get() @ApiOperation({ summary: 'List announcements' })
  findAll(@Query() q: Record<string, string>, @CurrentUser() u: Record<string, unknown>) { return this.svc.findAll(q, u as never); }

  @Post() @UseGuards(PermissionsGuard) @RequirePermission('announcements:manage', 'announcements:create_department', 'announcements:create_general') @Audit('ANNOUNCEMENT_CREATED')
  @ApiOperation({ summary: 'Create announcement' })
  create(@Body() body: Record<string, unknown>, @CurrentUser('sub') userId: string) { return this.svc.create(body, userId); }

  @Patch(':id/read') @ApiOperation({ summary: 'Mark announcement as read' })
  markRead(@Param('id') id: string, @CurrentUser('sub') userId: string) { return this.svc.markRead(id, userId); }

  @Delete(':id') @UseGuards(PermissionsGuard) @RequirePermission('announcements:manage')
  @ApiOperation({ summary: 'Delete announcement' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
