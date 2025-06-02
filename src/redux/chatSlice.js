import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    messages: [],
    activeChat: null,
    allChats: [],
    unreadCounts: {},
    isChatOpen: false
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setMessages: (state, action) => {
            state.messages = action.payload || [];
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        replaceMessage: (state, action) => {
            const { tempId, newMessage } = action.payload;
            const index = state.messages.findIndex(msg => msg._id === tempId);
            if (index !== -1) {
                state.messages[index] = newMessage;
            } else {
                state.messages.push(newMessage);
            }
        },
        markMessageAsFailed: (state, action) => {
            const tempId = action.payload;
            const index = state.messages.findIndex(msg => msg._id === tempId);
            if (index !== -1) {
                state.messages[index].failed = true;
            }
        },
        setActiveChat: (state, action) => {
            state.activeChat = action.payload;
        },
        setAllChats: (state, action) => {
            state.allChats = action.payload;
        },
        updateChatStatus: (state, action) => {
            const { userId, status } = action.payload;
            if (state.activeChat && state.activeChat.userId._id === userId) {
                state.activeChat.status = status;
            }
            const chatIndex = state.allChats.findIndex(chat => chat.userId._id === userId);
            if (chatIndex !== -1) {
                state.allChats[chatIndex].status = status;
            }
        },
        setUnreadCount: (state, action) => {
            const { userId, count } = action.payload;
            state.unreadCounts[userId] = count;
        },
        setChatOpen: (state, action) => {
            state.isChatOpen = action.payload;
        },
        updateMessageReadStatus: (state, action) => {
            const { userId, readMessages } = action.payload;
            state.messages = state.messages.map(message => {
                const isRead = readMessages.some(readMsg => readMsg._id === message._id);
                if (isRead) {
                    return { ...message, isRead: true };
                }
                return message;
            });
        },
        resetChat: (state) => {
            state.messages = [];
            state.activeChat = null;
            state.isChatOpen = false;
        }
    },
});

export const {
    setMessages,
    addMessage,
    setActiveChat,
    setAllChats,
    updateChatStatus,
    setUnreadCount,
    setChatOpen,
    updateMessageReadStatus,
    resetChat,
    replaceMessage,
    markMessageAsFailed
} = chatSlice.actions;

export default chatSlice.reducer; 