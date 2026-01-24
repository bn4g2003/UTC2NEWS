/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateCategoryDto } from '../models/CreateCategoryDto';
import type { CreateFaqDto } from '../models/CreateFaqDto';
import type { CreatePostDto } from '../models/CreatePostDto';
import type { UpdateCategoryDto } from '../models/UpdateCategoryDto';
import type { UpdateFaqDto } from '../models/UpdateFaqDto';
import type { UpdatePostDto } from '../models/UpdatePostDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CmsService {
    /**
     * Create category
     * Create a new content category
     * @param requestBody
     * @returns any Category created successfully
     * @throws ApiError
     */
    public static cmsControllerCreateCategory(
        requestBody: CreateCategoryDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cms/categories',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires categories:create permission`,
            },
        });
    }
    /**
     * Get all categories
     * Retrieve all content categories (public)
     * @returns any Categories retrieved successfully
     * @throws ApiError
     */
    public static cmsControllerFindAllCategories(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cms/categories',
        });
    }
    /**
     * Get category by ID
     * Retrieve a specific category (public)
     * @param id Category ID
     * @returns any Category retrieved successfully
     * @throws ApiError
     */
    public static cmsControllerFindCategoryById(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cms/categories/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Category not found`,
            },
        });
    }
    /**
     * Update category
     * Update an existing category
     * @param id Category ID
     * @param requestBody
     * @returns any Category updated successfully
     * @throws ApiError
     */
    public static cmsControllerUpdateCategory(
        id: string,
        requestBody: UpdateCategoryDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cms/categories/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires categories:update permission`,
                404: `Category not found`,
            },
        });
    }
    /**
     * Delete category
     * Delete a category
     * @param id Category ID
     * @returns any Category deleted successfully
     * @throws ApiError
     */
    public static cmsControllerDeleteCategory(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cms/categories/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires categories:delete permission`,
                404: `Category not found`,
            },
        });
    }
    /**
     * Search posts (Hybrid + Chunks)
     * Advanced search combining Vector embeddings, chunking, and keyword matching
     * @param q Search query
     * @param limit Number of results (default: 5)
     * @param hybrid Use hybrid search (default: true)
     * @param chunks Use chunk-based search (default: true)
     * @returns any Search results retrieved successfully
     * @throws ApiError
     */
    public static searchPosts(
        q: string,
        limit?: number,
        hybrid?: boolean,
        chunks?: boolean,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cms/posts/search',
            query: {
                'q': q,
                'limit': limit,
                'hybrid': hybrid,
                'chunks': chunks,
            },
        });
    }
    /**
     * Create post
     * Create a new content post
     * @param requestBody
     * @returns any Post created successfully
     * @throws ApiError
     */
    public static cmsControllerCreatePost(
        requestBody: CreatePostDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cms/posts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires posts:create permission`,
            },
        });
    }
    /**
     * Get all posts
     * Retrieve all posts, optionally filter by published status (public)
     * @param published Filter by published status (true/false)
     * @returns any Posts retrieved successfully
     * @throws ApiError
     */
    public static cmsControllerFindAllPosts(
        published?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cms/posts',
            query: {
                'published': published,
            },
        });
    }
    /**
     * Get post by ID
     * Retrieve a specific post (public)
     * @param id Post ID
     * @returns any Post retrieved successfully
     * @throws ApiError
     */
    public static cmsControllerFindPostById(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cms/posts/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Post not found`,
            },
        });
    }
    /**
     * Update post
     * Update an existing post
     * @param id Post ID
     * @param requestBody
     * @returns any Post updated successfully
     * @throws ApiError
     */
    public static cmsControllerUpdatePost(
        id: string,
        requestBody: UpdatePostDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cms/posts/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires posts:update permission`,
                404: `Post not found`,
            },
        });
    }
    /**
     * Delete post
     * Delete a post
     * @param id Post ID
     * @returns any Post deleted successfully
     * @throws ApiError
     */
    public static cmsControllerDeletePost(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cms/posts/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires posts:delete permission`,
                404: `Post not found`,
            },
        });
    }
    /**
     * Create FAQ
     * Create a new FAQ entry
     * @param requestBody
     * @returns any FAQ created successfully
     * @throws ApiError
     */
    public static cmsControllerCreateFaq(
        requestBody: CreateFaqDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cms/faqs',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires faqs:create permission`,
            },
        });
    }
    /**
     * Get all FAQs
     * Retrieve all FAQs, optionally filter by active status (public)
     * @param active Filter by active status (true/false)
     * @returns any FAQs retrieved successfully
     * @throws ApiError
     */
    public static cmsControllerFindAllFaqs(
        active?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cms/faqs',
            query: {
                'active': active,
            },
        });
    }
    /**
     * Get FAQ by ID
     * Retrieve a specific FAQ (public)
     * @param id FAQ ID
     * @returns any FAQ retrieved successfully
     * @throws ApiError
     */
    public static cmsControllerFindFaqById(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cms/faqs/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `FAQ not found`,
            },
        });
    }
    /**
     * Update FAQ
     * Update an existing FAQ
     * @param id FAQ ID
     * @param requestBody
     * @returns any FAQ updated successfully
     * @throws ApiError
     */
    public static cmsControllerUpdateFaq(
        id: string,
        requestBody: UpdateFaqDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cms/faqs/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden - requires faqs:update permission`,
                404: `FAQ not found`,
            },
        });
    }
    /**
     * Delete FAQ
     * Delete an FAQ
     * @param id FAQ ID
     * @returns any FAQ deleted successfully
     * @throws ApiError
     */
    public static cmsControllerDeleteFaq(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cms/faqs/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires faqs:delete permission`,
            },
        });
    }
    /**
     * Upload media file
     * Upload an image or PDF file (max 10MB)
     * @param formData
     * @returns any Media file uploaded successfully
     * @throws ApiError
     */
    public static cmsControllerUploadMedia(
        formData: {
            file?: Blob;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cms/media',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid file type or size`,
                403: `Forbidden - requires media:upload permission`,
            },
        });
    }
    /**
     * Get all media files
     * Retrieve all uploaded media files (public)
     * @returns any Media files retrieved successfully
     * @throws ApiError
     */
    public static cmsControllerFindAllMediaFiles(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cms/media',
        });
    }
    /**
     * Get media file by ID
     * Retrieve a specific media file (public)
     * @param id Media file ID
     * @returns any Media file retrieved successfully
     * @throws ApiError
     */
    public static cmsControllerFindMediaFileById(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cms/media/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Media file not found`,
            },
        });
    }
    /**
     * Delete media file
     * Delete a media file
     * @param id Media file ID
     * @returns any Media file deleted successfully
     * @throws ApiError
     */
    public static cmsControllerDeleteMediaFile(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cms/media/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Forbidden - requires media:delete permission`,
                404: `Media file not found`,
            },
        });
    }
}
