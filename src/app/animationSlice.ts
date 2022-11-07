import { createSlice } from '@reduxjs/toolkit';

export const animationSlice = createSlice({
    name: 'animation',
    initialState: {
        animate: false
    },
    reducers: {
        SET_ANIMATION: (state, action: {payload: boolean}) => {
            state.animate = action.payload;
        }
    },
});

export const { SET_ANIMATION } = animationSlice.actions;

export default animationSlice.reducer;
