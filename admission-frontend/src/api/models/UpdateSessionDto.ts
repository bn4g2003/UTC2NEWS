/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateSessionDto = {
    /**
     * Session name
     */
    name?: string;
    /**
     * Admission year
     */
    year?: number;
    /**
     * Session start date
     */
    startDate?: string;
    /**
     * Session end date
     */
    endDate?: string;
    /**
     * Session status
     */
    status?: UpdateSessionDto.status;
};
export namespace UpdateSessionDto {
    /**
     * Session status
     */
    export enum status {
        UPCOMING = 'upcoming',
        ACTIVE = 'active',
        CLOSED = 'closed',
    }
}

