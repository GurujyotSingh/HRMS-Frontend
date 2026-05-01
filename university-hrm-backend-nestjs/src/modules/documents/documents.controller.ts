import { Controller, Get, Post, Delete, Param, UploadedFile, UseInterceptors, Body, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Documents') @ApiBearerAuth() @Controller('documents')
export class DocumentsController {
  constructor(private svc: DocumentsService) {}

  @Post('upload') @UseInterceptors(FileInterceptor('file')) @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload document' })
  upload(@UploadedFile() file: Express.Multer.File, @Body() body: { employeeId: string; category: string; expiryDate?: string }) {
    return this.svc.upload(file, body.employeeId, body.category, body.expiryDate);
  }

  @Get(':employeeId') @ApiOperation({ summary: 'List documents for employee' })
  findByEmployee(@Param('employeeId') id: string) { return this.svc.findByEmployee(id); }

  @Get('file/:id') @ApiOperation({ summary: 'Download/view document' })
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.svc.getFile(id);
    const filePath = path.join(process.cwd(), doc.fileUrl);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'File not found' }); return; }
    res.setHeader('Content-Type', doc.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
    fs.createReadStream(filePath).pipe(res);
  }

  @Delete(':id') @ApiOperation({ summary: 'Delete document' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
