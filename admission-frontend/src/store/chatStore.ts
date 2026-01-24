import { create } from 'zustand';
import { wsClient } from '@/lib/websocket-client';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: string;
  metadata?: any;
  createdAt: string;
  sender: User;
}

interface ChatRoom {
  id: string;
  name?: string;
  type: string;
  participants: Array<{
    id: string;
    userId: string;
    user: User;
    role?: string;
  }>;
  messages?: Message[];
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface TypingUser {
  userId: string;
  roomId: string;
}

interface ChatStore {
  rooms: ChatRoom[];
  messages: Record<string, Message[]>;
  activeRoomId: string | null;
  typingUsers: TypingUser[];
  onlineUsers: string[];
  isConnected: boolean;

  // Actions
  setRooms: (rooms: ChatRoom[]) => void;
  addRoom: (room: ChatRoom) => void;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;
  setActiveRoom: (roomId: string | null) => void;
  addMessage: (message: Message) => void;
  setMessages: (roomId: string, messages: Message[]) => void;
  addTypingUser: (userId: string, roomId: string) => void;
  removeTypingUser: (userId: string, roomId: string) => void;
  setOnlineUsers: (users: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
  removeMessage: (messageId: string, roomId: string) => void;
  removeRoom: (roomId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  rooms: [],
  messages: {},
  activeRoomId: null,
  typingUsers: [],
  onlineUsers: [],
  isConnected: false,

  setRooms: (rooms) => set({ rooms }),

  addRoom: (room) =>
    set((state) => ({
      rooms: [room, ...state.rooms],
    })),

  updateRoom: (roomId, updates) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, ...updates } : room
      ),
    })),

  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  addMessage: (message) =>
    set((state) => {
      const roomMessages = state.messages[message.roomId] || [];

      // Prevent duplicates
      if (roomMessages.some(m => m.id === message.id)) {
        return state;
      }

      // Update room's updatedAt and move to top
      const updatedRooms = state.rooms.map((room) => {
        if (room.id === message.roomId) {
          return {
            ...room,
            updatedAt: message.createdAt,
            messages: [message],
          };
        }
        return room;
      }).sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return {
        messages: {
          ...state.messages,
          [message.roomId]: [...roomMessages, message],
        },
        rooms: updatedRooms,
      };
    }),

  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: messages,
      },
    })),

  addTypingUser: (userId, roomId) =>
    set((state) => {
      // Prevent duplicates
      const exists = state.typingUsers.some(
        (tu) => tu.userId === userId && tu.roomId === roomId
      );
      if (exists) return state;

      return {
        typingUsers: [...state.typingUsers, { userId, roomId }],
      };
    }),

  removeTypingUser: (userId, roomId) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter(
        (tu) => !(tu.userId === userId && tu.roomId === roomId),
      ),
    })),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: [...new Set([...state.onlineUsers, userId])],
    })),

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    })),

  setConnected: (connected) => set({ isConnected: connected }),

  reset: () =>
    set({
      rooms: [],
      messages: {},
      activeRoomId: null,
      typingUsers: [],
      onlineUsers: [],
      isConnected: false,
    }),

  removeMessage: (messageId, roomId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).filter((m) => m.id !== messageId),
      },
    })),

  removeRoom: (roomId) =>
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== roomId),
      activeRoomId: state.activeRoomId === roomId ? null : state.activeRoomId,
    })),
}));
