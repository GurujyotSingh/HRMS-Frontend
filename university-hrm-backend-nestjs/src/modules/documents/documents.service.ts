import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async upload(file: Express.Multer.File, employeeId: string, category: string, expiryDate?: string) {
    const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', employeeId);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return this.prisma.document.create({
      data: {
        employeeId, fileName, originalName: file.originalname,
        fileUrl: `/uploads/${employeeId}/${fileName}`,
        fileType: file.mimetype, fileSize: file.size, category,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });
  }

  async findByEmployee(employeeId: string) {
    return this.prisma.document.findMany({ where: { employeeId }, orderBy: { uploadedAt: 'desc' } });
  }

  async getFile(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    const filePath = path.join(process.cwd(), doc.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return this.prisma.document.delete({ where: { id } });
  }
}
