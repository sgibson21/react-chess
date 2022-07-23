import { createSlice } from '@reduxjs/toolkit';

export const counterSlice = createSlice({
    name: 'counter',
    initialState: {
        value: 0,
    },
    reducers: {
        increment: state => {state.value += 1},
        decrement: s => {s.value -= 1},
        incrementBy: (state, action) => {
            state.value += action.payload;
        }
    },
});

export const { increment, decrement, incrementBy } = counterSlice.actions;

export default counterSlice.reducer;
