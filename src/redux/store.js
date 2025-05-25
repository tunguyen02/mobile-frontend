import { configureStore } from '@reduxjs/toolkit';
import userStore from "./userStore";
import cartSlice from "./cartSlice";
import chatReducer from "./chatSlice";

const store = configureStore({
    reducer: {
        user: userStore,
        cart: cartSlice,
        chat: chatReducer,
    }
});

export default store;