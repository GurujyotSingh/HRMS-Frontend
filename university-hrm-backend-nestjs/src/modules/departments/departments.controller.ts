import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';

class CreateDepartmentDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() code: string;
  @ApiPropertyOptional() @IsOptional() @IsString() directorId?: string;
}

class UpdateDepartmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() directorId?: string;
}

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
@UseInterceptors(AuditLogInterceptor)
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all departments' })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department with employees' })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('departments:manage')
  @ApiOperation({ summary: 'Create department' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('departments:manage')
  @ApiOperation({ summary: 'Update department' })
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete department (SUPER_ADMIN only)' })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
