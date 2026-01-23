/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateFaqDto = {
    /**
     * FAQ question
     */
    question: string;
    /**
     * FAQ answer
     */
    answer: string;
    /**
     * Display order (lower numbers appear first)
     */
    displayOrder?: number;
    /**
     * Whether the FAQ is active
     */
    isActive?: boolean;
};

