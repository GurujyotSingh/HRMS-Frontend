import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HolidaysService } from './holidays.service';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@ApiTags('Holidays') @ApiBearerAuth() @Controller('holidays')
export class HolidaysController {
  constructor(private svc: HolidaysService) {}

  @Get() @ApiOperation({ summary: 'List holidays' })
  findAll(@Query('year') year?: string) { return this.svc.findAll(year ? parseInt(year) : undefined); }

  @Post() @UseGuards(PermissionsGuard) @RequirePermission('settings:system')
  @ApiOperation({ summary: 'Create holiday' })
  create(@Body() body: Record<string, unknown>) { return this.svc.create(body as never); }

  @Patch(':id') @UseGuards(PermissionsGuard) @RequirePermission('settings:system')
  @ApiOperation({ summary: 'Update holiday' })
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.svc.update(id, body); }

  @Delete(':id') @UseGuards(PermissionsGuard) @RequirePermission('settings:system')
  @ApiOperation({ summary: 'Delete holiday' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
