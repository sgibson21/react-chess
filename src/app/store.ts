import { configureStore } from '@reduxjs/toolkit';
import animationSlice from './animationSlice';
import boardStateSlice from './boardStateSlice';
import settingsSlice, { onlineSettingsMiddleware } from './settingsSlice';

const store = configureStore({
    reducer: {
        boardState: boardStateSlice,
        animation: animationSlice,
        settings: settingsSlice
    },
    middleware(getDefaultMiddleware) {
        return getDefaultMiddleware().concat(onlineSettingsMiddleware);
    },
    devTools: true
});

export type AppDispatch = typeof store.dispatch;
export const dispatch = store.dispatch;

export default store;
