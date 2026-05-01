import { Controller, Get, Patch, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Settings') @ApiBearerAuth() @Controller('settings') @UseInterceptors(AuditLogInterceptor)
export class SettingsController {
  constructor(private svc: SettingsService) {}

  @Get() @ApiOperation({ summary: 'Get system settings' })
  get() { return this.svc.get(); }

  @Patch() @UseGuards(PermissionsGuard) @RequirePermission('settings:system') @Audit('SETTINGS_UPDATED')
  @ApiOperation({ summary: 'Update system settings' })
  update(@Body() body: Record<string, unknown>) { return this.svc.update(body); }
}
