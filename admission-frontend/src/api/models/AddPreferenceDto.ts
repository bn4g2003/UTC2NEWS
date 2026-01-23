/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubjectScoresDto } from './SubjectScoresDto';
export type AddPreferenceDto = {
    /**
     * Admission session ID
     */
    sessionId: string;
    /**
     * Major code
     */
    majorCode: string;
    /**
     * Admission method
     */
    admissionMethod: AddPreferenceDto.admissionMethod;
    /**
     * Preference priority (1 = first choice, 2 = second choice, etc.)
     */
    preferencePriority: number;
    /**
     * Subject scores
     */
    subjectScores: SubjectScoresDto;
};
export namespace AddPreferenceDto {
    /**
     * Admission method
     */
    export enum admissionMethod {
        ENTRANCE_EXAM = 'entrance_exam',
        HIGH_SCHOOL_TRANSCRIPT = 'high_school_transcript',
        DIRECT_ADMISSION = 'direct_admission',
    }
}

