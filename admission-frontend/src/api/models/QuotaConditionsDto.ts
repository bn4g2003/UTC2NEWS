/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type QuotaConditionsDto = {
    /**
     * Minimum total score (before priority bonus)
     */
    minTotalScore?: number;
    /**
     * Minimum score for each subject
     */
    minSubjectScores?: Record<string, any>;
    /**
     * Required subjects that must have scores
     */
    requiredSubjects?: Array<string>;
    /**
     * Valid subject combinations
     */
    subjectCombinations?: Array<string>;
    /**
     * Priority bonus configuration
     */
    priorityBonus?: Record<string, any>;
};

