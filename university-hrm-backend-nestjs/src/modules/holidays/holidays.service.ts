import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HolidayType } from '@prisma/client';

@Injectable()
export class HolidaysService {
  constructor(private prisma: PrismaService) {}

  async findAll(year?: number) {
    const y = year || new Date().getFullYear();
    return this.prisma.holiday.findMany({
      where: { date: { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) } },
      orderBy: { date: 'asc' },
    });
  }

  async create(data: { name: string; date: string; type: HolidayType; isOptional?: boolean }) {
    return this.prisma.holiday.create({ data: { name: data.name, date: new Date(data.date), type: data.type, isOptional: data.isOptional || false } });
  }

  async update(id: string, data: Record<string, unknown>) {
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.date) updateData.date = new Date(data.date as string);
    if (data.type) updateData.type = data.type;
    if (data.isOptional !== undefined) updateData.isOptional = data.isOptional;
    return this.prisma.holiday.update({ where: { id }, data: updateData });
  }

  async remove(id: string) { return this.prisma.holiday.delete({ where: { id } }); }
}
