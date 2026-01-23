/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateStudentDto = {
    /**
     * Student ID card number
     */
    idCard: string;
    /**
     * Student full name
     */
    fullName: string;
    /**
     * Student date of birth
     */
    dateOfBirth: string;
    /**
     * Student email address
     */
    email?: string;
    /**
     * Student phone number
     */
    phone?: string;
    /**
     * Student address
     */
    address?: string;
    /**
     * Priority points (0-3)
     */
    priorityPoints?: number;
    /**
     * ID of the admission session
     */
    sessionId: string;
    /**
     * Student scores in JSON format
     */
    scores?: Record<string, any>;
    /**
     * Path to 3x4 photo
     */
    photo3x4?: string;
    /**
     * Path to ID card photo
     */
    idCardPhoto?: string;
    /**
     * Path to optional PDF document
     */
    documentPdf?: string;
};

