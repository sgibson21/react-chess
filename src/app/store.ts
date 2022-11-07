import { configureStore } from '@reduxjs/toolkit';
import animationSlice from './animationSlice';
import boardStateSlice from './boardStateSlice';
import settingsSlice from './settingsSlice';

const store = configureStore({
    reducer: {
        boardState: boardStateSlice,
        animation: animationSlice,
        settings: settingsSlice
    },
    devTools: true
});

export type AppDispatch = typeof store.dispatch;
export const dispatch = store.dispatch;

export default store;
