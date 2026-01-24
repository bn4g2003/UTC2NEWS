/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddMemberDto } from '../models/AddMemberDto';
import type { CreateRoomDto } from '../models/CreateRoomDto';
import type { RemoveMemberDto } from '../models/RemoveMemberDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChatService {
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static chatControllerCreateRoom(
        requestBody: CreateRoomDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static chatControllerGetUserRooms(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms',
        });
    }
    /**
     * @param roomId
     * @param limit
     * @param before
     * @returns any
     * @throws ApiError
     */
    public static chatControllerGetRoomMessages(
        roomId: string,
        limit: string,
        before: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/{roomId}/messages',
            path: {
                'roomId': roomId,
            },
            query: {
                'limit': limit,
                'before': before,
            },
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static chatControllerGetPublicChannels(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/channels/public',
        });
    }
    /**
     * @param roomId
     * @returns any
     * @throws ApiError
     */
    public static chatControllerJoinChannel(
        roomId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/channels/{roomId}/join',
            path: {
                'roomId': roomId,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static chatControllerAddMembers(
        requestBody: AddMemberDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/members/add',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static chatControllerRemoveMember(
        requestBody: RemoveMemberDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/chat/rooms/members/remove',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static chatControllerGetOnlineUsers(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/presence/online',
        });
    }
    /**
     * @param userId
     * @returns any
     * @throws ApiError
     */
    public static chatControllerGetUserPresence(
        userId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/presence/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
}
