import { createSlice } from "@reduxjs/toolkit";

const sortMessagesByTime = (messages) => {
    return [...messages].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
    });
};

const removeDuplicateMessages = (messages) => {
    const uniqueMessages = [];
    const seenIds = new Map();
    const seenContents = new Map();

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];

        if (msg._id && !seenIds.has(msg._id)) {
            seenIds.set(msg._id, i);

            if (msg.content) {
                const contentKey = `${msg.sender}:${msg.content}:${new Date(msg.createdAt).getMinutes()}`;
                seenContents.set(contentKey, i);
            }

            uniqueMessages.push(msg);
        }
        else if (!msg._id || msg._id.startsWith('temp-')) {
            if (msg.content) {
                const contentKey = `${msg.sender}:${msg.content}:${new Date(msg.createdAt).getMinutes()}`;

                if (!seenContents.has(contentKey)) {
                    seenContents.set(contentKey, i);
                    uniqueMessages.push(msg);
                }
                else {
                    const existingIndex = seenContents.get(contentKey);
                    const existingMsg = messages[existingIndex];

                    if (!msg._id.startsWith('temp-') && existingMsg._id.startsWith('temp-')) {
                        const tempIndex = uniqueMessages.findIndex(m => m._id === existingMsg._id);
                        if (tempIndex !== -1) {
                            uniqueMessages[tempIndex] = msg;
                            seenIds.set(msg._id, tempIndex);
                        }
                    }
                }
            } else {
                uniqueMessages.push(msg);
            }
        }
    }

    return uniqueMessages;
};

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
            const messages = action.payload || [];
            state.messages = sortMessagesByTime(removeDuplicateMessages(messages));
        },

        addMessage: (state, action) => {
            const messageExists = state.messages.some(msg =>
                msg._id === action.payload._id ||
                (msg.content === action.payload.content &&
                    msg.sender === action.payload.sender &&
                    Math.abs(new Date(msg.createdAt) - new Date(action.payload.createdAt)) < 60000)
            );

            if (!messageExists) {
                const newMessages = [...state.messages, action.payload];
                state.messages = sortMessagesByTime(removeDuplicateMessages(newMessages));
            }
        },

        replaceMessage: (state, action) => {
            const { tempId, newMessage } = action.payload;
            const updatedMessages = state.messages.filter(msg => msg._id !== tempId);

            const messageExists = updatedMessages.some(msg =>
                msg._id === newMessage._id ||
                (msg.content === newMessage.content &&
                    msg.sender === newMessage.sender &&
                    Math.abs(new Date(msg.createdAt) - new Date(newMessage.createdAt)) < 60000)
            );

            if (!messageExists) {
                updatedMessages.push(newMessage);
            }

            state.messages = sortMessagesByTime(removeDuplicateMessages(updatedMessages));
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