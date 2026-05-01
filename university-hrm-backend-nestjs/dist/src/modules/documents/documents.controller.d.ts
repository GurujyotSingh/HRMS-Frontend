import { DocumentsService } from './documents.service';
import { Response } from 'express';
export declare class DocumentsController {
    private svc;
    constructor(svc: DocumentsService);
    upload(file: Express.Multer.File, body: {
        employeeId: string;
        category: string;
        expiryDate?: string;
    }): Promise<{
        id: string;
        employeeId: string;
        fileName: string;
        originalName: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        category: string;
        expiryDate: Date | null;
        uploadedAt: Date;
    }>;
    findByEmployee(id: string): Promise<{
        id: string;
        employeeId: string;
        fileName: string;
        originalName: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        category: string;
        expiryDate: Date | null;
        uploadedAt: Date;
    }[]>;
    getFile(id: string, res: Response): Promise<void>;
    remove(id: string): Promise<{
        id: string;
        employeeId: string;
        fileName: string;
        originalName: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        category: string;
        expiryDate: Date | null;
        uploadedAt: Date;
    }>;
}
