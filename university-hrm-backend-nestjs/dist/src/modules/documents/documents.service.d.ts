import { PrismaService } from '../../prisma/prisma.service';
export declare class DocumentsService {
    private prisma;
    constructor(prisma: PrismaService);
    upload(file: Express.Multer.File, employeeId: string, category: string, expiryDate?: string): Promise<{
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
    findByEmployee(employeeId: string): Promise<{
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
    getFile(id: string): Promise<{
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
