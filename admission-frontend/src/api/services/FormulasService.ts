/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FormulasService {
    /**
     * Create a new admission formula
     * @returns any
     * @throws ApiError
     */
    public static formulaControllerCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/formulas',
        });
    }
    /**
     * Get all admission formulas
     * @returns any
     * @throws ApiError
     */
    public static formulaControllerFindAll(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/formulas',
        });
    }
    /**
     * Get a formula by ID
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static formulaControllerFindOne(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/formulas/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update a formula
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static formulaControllerUpdate(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/formulas/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Delete a formula
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static formulaControllerRemove(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/formulas/{id}',
            path: {
                'id': id,
            },
        });
    }
}
