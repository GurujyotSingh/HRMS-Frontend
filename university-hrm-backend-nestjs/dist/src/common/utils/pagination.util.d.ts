export declare class PaginationDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T>;
export declare function paginationArgs(dto: PaginationDto): {
    skip: number;
    take: number;
};
