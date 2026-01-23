/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
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
     * Admission method
     */
    admissionMethod: CreateQuotaDto.admissionMethod;
    /**
     * Number of admission slots
     */
    quota: number;
};
export namespace CreateQuotaDto {
    /**
     * Admission method
     */
    export enum admissionMethod {
        ENTRANCE_EXAM = 'entrance_exam',
        HIGH_SCHOOL_TRANSCRIPT = 'high_school_transcript',
        DIRECT_ADMISSION = 'direct_admission',
    }
}

