import {
  IsString, IsEmail, IsOptional, IsEnum, IsArray, IsNumber, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { SystemRole, EmploymentType, Gender } from '@prisma/client';
import { PaginationDto } from '../../../common/utils/pagination.util';

export class CreateUserDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsEmail() workEmail: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() personalEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional({ enum: Gender }) @IsOptional() @IsEnum(Gender) gender?: Gender;
  @ApiPropertyOptional() @IsOptional() @IsString() nationality?: string;
  @ApiPropertyOptional({ enum: SystemRole }) @IsOptional() @IsEnum(SystemRole) role?: SystemRole;
  @ApiPropertyOptional() @IsOptional() @IsString() designation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional({ enum: EmploymentType }) @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salary?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() joinDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() street?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pincode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyRelation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() emergencyEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reportingManagerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class ChangeRoleDto {
  @ApiProperty({ enum: SystemRole }) @IsEnum(SystemRole) role: SystemRole;
}

export class ChangeStatusDto {
  @ApiProperty() @IsString() status: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class QueryUsersDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employmentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() role?: string;
}
