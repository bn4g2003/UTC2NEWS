/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuotaConditionsDto } from './QuotaConditionsDto';

export type UpdateQuotaDto = {
    /**
     * Number of admission slots
     */
    quota?: number;
    /**
     * Admission conditions and criteria
     */
    conditions?: QuotaConditionsDto;
};

