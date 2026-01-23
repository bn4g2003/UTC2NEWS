/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateMajorDto = {
    /**
     * Unique major code
     */
    code: string;
    /**
     * Major name
     */
    name: string;
    /**
     * Subject combinations for admission
     */
    subjectCombinations: Record<string, any>;
    /**
     * Major description
     */
    description?: string;
    /**
     * Whether the major is active
     */
    isActive?: boolean;
};

