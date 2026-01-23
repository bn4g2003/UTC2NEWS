/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateUserDto = {
    /**
     * Username for login
     */
    username: string;
    /**
     * User password
     */
    password: string;
    /**
     * User email address
     */
    email: string;
    /**
     * Full name of the user
     */
    fullName: string;
    /**
     * Whether the user account is active
     */
    isActive?: boolean;
};

