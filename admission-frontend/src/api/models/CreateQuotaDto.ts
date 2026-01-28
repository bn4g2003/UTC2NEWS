/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuotaConditionsDto } from './QuotaConditionsDto';
export type CreateQuotaDto = {
    /**
     * Admission session ID
     */
    sessionId: string;
    /**
     * Major ID
     */
    majorId: string;
    /**
     * Formula ID for this quota
     */
    formulaId: string;
    /**
     * Number of admission slots
     */
    quota: number;
    /**
     * Admission conditions and criteria
     */
    conditions?: QuotaConditionsDto;
};

