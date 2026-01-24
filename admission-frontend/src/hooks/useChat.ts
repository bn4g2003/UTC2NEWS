import { useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { wsClient } from '@/lib/websocket-client';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { CmsService } from '@/api';

export function useChat() {
  const socketRef = useRef<Socket | null>(null);
  const { token, user } = useAuthStore();
  const {
    rooms,
    messages,
    activeRoomId,
    typingUsers,
    onlineUsers,
    isConnected,
    setRooms,
    addRoom,
    updateRoom,
    setActiveRoom,
    addMessage,
    setMessages,
    updateMessage,
    addTypingUser,
    removeTypingUser,
    addOnlineUser,
    removeOnlineUser,
    setConnected,
    reset,
    removeMessage,
    removeRoom,
  } = useChatStore();

  // Connect to WebSocket
  useEffect(() => {
    if (token && !socketRef.current) {
      const socket = wsClient.connect(token);
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setConnected(true);
        // Load rooms when connected
        loadRooms();
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setConnected(false);
      });

      socket.on('reconnect', () => {
        console.log('WebSocket reconnected');
        setConnected(true);
        // Reload rooms on reconnect
        loadRooms();
      });

      socket.on('message:new', (message: any) => {
        console.log('New message received:', message);
        addMessage(message);
      });

      socket.on('message:updated', (message: any) => {
        console.log('Message updated:', message);
        updateMessage(message);
      });

      socket.on('message:reaction:added', ({ messageId, reaction }: any) => {
        console.log('Reaction added:', { messageId, reaction });
        // Reload messages for the room to get updated reactions
        // Or update locally if we have the message
        const roomId = Object.keys(messages).find(rId =>
          messages[rId]?.some(m => m.id === messageId)
        );
        if (roomId) {
          loadMessages(roomId);
        }
      });

      socket.on('message:reaction:removed', ({ messageId, emoji, userId }: any) => {
        console.log('Reaction removed:', { messageId, emoji, userId });
        // Reload messages for the room to get updated reactions
        const roomId = Object.keys(messages).find(rId =>
          messages[rId]?.some(m => m.id === messageId)
        );
        if (roomId) {
          loadMessages(roomId);
        }
      });

      socket.on('room:created', (room: any) => {
        console.log('Room created:', room);
        addRoom(room);
      });

      socket.on('typing:user', ({ userId, roomId, isTyping }: any) => {
        if (isTyping) {
          addTypingUser(userId, roomId);
        } else {
          removeTypingUser(userId, roomId);
        }
      });

      socket.on('user:online', ({ userId }: any) => {
        addOnlineUser(userId);
      });

      socket.on('user:offline', ({ userId }: any) => {
        removeOnlineUser(userId);
      });

      socket.on('message:read', ({ roomId, userId }: any) => {
        console.log('Message read:', { roomId, userId });
        // Update room to reflect read status
        updateRoom(roomId, { unreadCount: 0 });
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
        reset();
      };
    }
  }, [token]);

  // Load rooms
  const loadRooms = useCallback(async () => {
    if (!token) return;

    try {
      const [roomsResponse, channelsResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/rooms`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/channels/public`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      ]);

      if (!roomsResponse.ok) {
        throw new Error('Failed to load rooms');
      }

      const roomsData = await roomsResponse.json();

      let allRooms = roomsData;
      if (channelsResponse.ok) {
        const channelsData = await channelsResponse.json();
        // Merge public channels that are not already in joined rooms
        const joinedRoomIds = new Set(roomsData.map((r: any) => r.id));
        const newChannels = channelsData.filter((c: any) => !joinedRoomIds.has(c.id));
        allRooms = [...roomsData, ...newChannels];
      }

      // Sort by updatedAt desc
      allRooms.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setRooms(allRooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  }, [token, setRooms]);

  // Load messages for a room
  const loadMessages = useCallback(
    async (roomId: string, limit = 50, before?: string) => {
      if (!token) return;

      try {
        const url = new URL(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/rooms/${roomId}/messages`,
        );
        url.searchParams.append('limit', limit.toString());
        if (before) {
          url.searchParams.append('before', before);
        }

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load messages');
        }

        const data = await response.json();
        setMessages(roomId, data);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    },
    [token, setMessages],
  );

  // Create room
  const createRoom = useCallback(
    async (participantIds: string[], name?: string, type = 'DIRECT', isPublic?: boolean, description?: string) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      if ((!participantIds || participantIds.length === 0) && type !== 'CHANNEL') {
        throw new Error('At least one participant is required');
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/rooms`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              participantIds,
              name,
              type,
              isPublic,
              description,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create room');
        }

        const room = await response.json();

        // Emit to socket to notify other participants
        if (socketRef.current?.connected) {
          socketRef.current.emit('room:create', {
            ...room, // Send full room object
          });
        }

        // Add room to store if not already added
        addRoom(room);

        // Set as active room
        setActiveRoom(room.id);

        return room;
      } catch (error) {
        console.error('Failed to create room:', error);
        throw error;
      }
    },
    [token, addRoom, setActiveRoom],
  );

  // Send message
  const sendMessage = useCallback(
    (roomId: string, content: string, type = 'TEXT', metadata?: any) => {
      if (!socketRef.current?.connected) {
        console.error('Socket not connected');
        return;
      }

      if (!content.trim()) {
        console.error('Message content is empty');
        return;
      }

      socketRef.current.emit('message:send', {
        roomId,
        content,
        type,
        metadata,
      });
    },
    [],
  );

  // Typing indicator
  const startTyping = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing:start', { roomId, isTyping: true });
  }, []);

  const stopTyping = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing:stop', { roomId, isTyping: false });
  }, []);

  // Mark as read
  const markAsRead = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('message:read', { roomId });
    // Update local state
    updateRoom(roomId, { unreadCount: 0 });
  }, [updateRoom]);

  // Add members
  const addMembers = useCallback(
    async (roomId: string, userIds: string[]) => {
      if (!token) return;

      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/rooms/members/add`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ roomId, userIds }),
          }
        );

        // Reload rooms to update participant list
        loadRooms();
      } catch (error) {
        console.error('Failed to add members:', error);
        throw error;
      }
    },
    [token, loadRooms],
  );

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Update local state immediately
      if (activeRoomId) {
        removeMessage(messageId, activeRoomId);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }, [token, activeRoomId, removeMessage]);

  // Delete room
  const deleteRoom = useCallback(async (roomId: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/rooms/${roomId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete room');
      }

      removeRoom(roomId);
    } catch (error) {
      console.error('Failed to delete room:', error);
      throw error;
    }
  }, [token, removeRoom]);

  return {
    rooms,
    messages,
    activeRoomId,
    typingUsers,
    onlineUsers,
    isConnected,
    setActiveRoom,
    loadRooms,
    loadMessages,
    createRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    addMembers,
    removeMember: useCallback(async (roomId: string, userId: string) => {
      if (!token) return;
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/rooms/members/remove`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ roomId, userId }),
          }
        );
        loadRooms();
      } catch (error) {
        console.error('Failed to remove member:', error);
        throw error;
      }
    }, [token, loadRooms]),
    deleteMessage,
    deleteRoom,
    socketRef,
    pinMessage: useCallback((messageId: string) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit('message:pin', { messageId });
    }, []),
    unpinMessage: useCallback((messageId: string) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit('message:unpin', { messageId });
    }, []),
    uploadFile: useCallback(async (file: File) => {
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      return response.json();
      return response.json();
    }, [token]),
    loadPinnedMessages: useCallback(async (roomId: string) => {
      if (!token) return [];
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/chat/rooms/${roomId}/pinned`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error('Failed to load pinned messages:', error);
        return [];
      }
    }, [token]),
  };
}
