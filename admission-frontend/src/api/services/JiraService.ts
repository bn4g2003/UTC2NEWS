/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateCommentDto } from '../models/CreateCommentDto';
import type { CreateProjectDto } from '../models/CreateProjectDto';
import type { CreateTaskDto } from '../models/CreateTaskDto';
import type { MoveTaskDto } from '../models/MoveTaskDto';
import type { UpdateTaskDto } from '../models/UpdateTaskDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class JiraService {
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerCreateProject(
        requestBody: CreateProjectDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/jira/projects',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerGetProjects(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/jira/projects',
        });
    }
    /**
     * @param projectId
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerGetProject(
        projectId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/jira/projects/{projectId}',
            path: {
                'projectId': projectId,
            },
        });
    }
    /**
     * @param projectId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerCreateTask(
        projectId: string,
        requestBody: CreateTaskDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/jira/projects/{projectId}/tasks',
            path: {
                'projectId': projectId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param taskId
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerGetTask(
        taskId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/jira/tasks/{taskId}',
            path: {
                'taskId': taskId,
            },
        });
    }
    /**
     * @param taskId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerUpdateTask(
        taskId: string,
        requestBody: UpdateTaskDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/jira/tasks/{taskId}',
            path: {
                'taskId': taskId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param taskId
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerDeleteTask(
        taskId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/jira/tasks/{taskId}',
            path: {
                'taskId': taskId,
            },
        });
    }
    /**
     * @param taskId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerMoveTask(
        taskId: string,
        requestBody: MoveTaskDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/jira/tasks/{taskId}/move',
            path: {
                'taskId': taskId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param taskId
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerCreateComment(
        taskId: string,
        requestBody: CreateCommentDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/jira/tasks/{taskId}/comments',
            path: {
                'taskId': taskId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param projectId
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerGetMyTasks(
        projectId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/jira/my-tasks',
            query: {
                'projectId': projectId,
            },
        });
    }
    /**
     * @param projectId
     * @param q
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerSearchTasks(
        projectId: string,
        q: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/jira/projects/{projectId}/search',
            path: {
                'projectId': projectId,
            },
            query: {
                'q': q,
            },
        });
    }
    /**
     * @param projectId
     * @returns any
     * @throws ApiError
     */
    public static jiraControllerGetActivityLogs(
        projectId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/jira/projects/{projectId}/activity',
            path: {
                'projectId': projectId,
            },
        });
    }
}
