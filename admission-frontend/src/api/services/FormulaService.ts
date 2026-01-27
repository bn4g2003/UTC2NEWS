/* Quản lý Công thức tính điểm (AdmissionFormula) */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface FormulaDto {
    id?: string;
    name: string;
    formula: string;
    description?: string;
}

export class FormulaService {
    /**
     * Lấy danh sách tất cả công thức
     */
    public static findAll(): CancelablePromise<FormulaDto[]> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/formulas',
        });
    }

    /**
     * Lấy chi tiết một công thức
     */
    public static findById(id: string): CancelablePromise<FormulaDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: `/api/formulas/${id}`,
        });
    }

    /**
     * Tạo công thức mới
     */
    public static create(data: FormulaDto): CancelablePromise<FormulaDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/formulas',
            body: data,
            mediaType: 'application/json',
        });
    }

    /**
     * Cập nhật công thức
     */
    public static update(id: string, data: FormulaDto): CancelablePromise<FormulaDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: `/api/formulas/${id}`,
            body: data,
            mediaType: 'application/json',
        });
    }

    /**
     * Xóa công thức
     */
    public static delete(id: string): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: `/api/formulas/${id}`,
        });
    }
}
