import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@ApiTags('Audit') @ApiBearerAuth() @Controller('audit') @UseGuards(PermissionsGuard)
export class AuditController {
  constructor(private svc: AuditService) {}

  @Get() @RequirePermission('audit:view')
  @ApiOperation({ summary: 'List audit logs' })
  findAll(@Query() q: Record<string, string>) { return this.svc.findAll(q); }
}
