import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    products: [],
    totalPrice: 0,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        setCart(state, action) {
            return { ...action.payload };
        },
        resetCart() {
            return { ...initialState };
        },
    },
});

export const { setCart, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
