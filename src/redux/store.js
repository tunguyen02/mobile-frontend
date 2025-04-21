import { configureStore } from '@reduxjs/toolkit';
import userStore from "./userStore";
import cartSlice from "./cartSlice";

const store = configureStore({
    reducer: {
        user: userStore,
        cart: cartSlice,
    }
});

export default store;