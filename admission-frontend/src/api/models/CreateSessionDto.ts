/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateSessionDto = {
    /**
     * Session name
     */
    name: string;
    /**
     * Admission year
     */
    year: number;
    /**
     * Session start date
     */
    startDate: string;
    /**
     * Session end date
     */
    endDate: string;
    /**
     * Session status
     */
    status: CreateSessionDto.status;
};
export namespace CreateSessionDto {
    /**
     * Session status
     */
    export enum status {
        UPCOMING = 'upcoming',
        ACTIVE = 'active',
        CLOSED = 'closed',
    }
}

