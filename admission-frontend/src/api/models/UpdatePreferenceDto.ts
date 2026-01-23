/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubjectScoresDto } from './SubjectScoresDto';
export type UpdatePreferenceDto = {
    /**
     * Major code
     */
    majorCode?: string;
    /**
     * Admission method
     */
    admissionMethod?: UpdatePreferenceDto.admissionMethod;
    /**
     * Preference priority
     */
    preferencePriority?: number;
    /**
     * Subject scores
     */
    subjectScores?: SubjectScoresDto;
};
export namespace UpdatePreferenceDto {
    /**
     * Admission method
     */
    export enum admissionMethod {
        ENTRANCE_EXAM = 'entrance_exam',
        HIGH_SCHOOL_TRANSCRIPT = 'high_school_transcript',
        DIRECT_ADMISSION = 'direct_admission',
    }
}

