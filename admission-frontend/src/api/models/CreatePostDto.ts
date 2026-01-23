/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreatePostDto = {
    /**
     * Post title
     */
    title: string;
    /**
     * URL-friendly slug
     */
    slug: string;
    /**
     * Post content (HTML or Markdown)
     */
    content: string;
    /**
     * Brief excerpt or summary
     */
    excerpt?: string;
    /**
     * Featured image URL
     */
    featuredImage?: string;
    /**
     * Category ID
     */
    categoryId?: string;
    /**
     * Post status
     */
    status: CreatePostDto.status;
    /**
     * Author user ID
     */
    authorId?: string;
};
export namespace CreatePostDto {
    /**
     * Post status
     */
    export enum status {
        DRAFT = 'draft',
        PUBLISHED = 'published',
    }
}

