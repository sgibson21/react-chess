import { Action, createSlice, Dispatch, MiddlewareAPI } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';

const SESSION_KEY = 'react-chess-user-id';

export const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        gameOverWindowClosed: false,
        username: sessionStorage.getItem(SESSION_KEY) || null as string | null,
    },
    reducers: {
        SET_GAME_OVER_WINDOW_CLOSED: (state, action: {payload: boolean}) => {
            state.gameOverWindowClosed = action.payload;
        },
        SET_ONLINE_USERNAME: (state, action: {payload: string | null}) => {
            state.username = action.payload;
        }
    },
});

export const { SET_GAME_OVER_WINDOW_CLOSED, SET_ONLINE_USERNAME } = settingsSlice.actions;

export const useGameOverWindowClosed = () => {
    return useSelector((state: any) => state.settings.gameOverWindowClosed);
};

export const useOnlineUsername: () => string | null = () => {
    return useSelector((state: any) => state.settings.username);
}

export const onlineSettingsMiddleware = (store: MiddlewareAPI) => (next: Dispatch) => <A extends Action>(action: A) => {
    if (settingsSlice.actions.SET_ONLINE_USERNAME.match(action)) {
        if (action.payload === null) {
            sessionStorage.removeItem(SESSION_KEY);
        } else {
            sessionStorage.setItem(SESSION_KEY, action.payload);
        }
    }
    return next(action);
}

export default settingsSlice.reducer;
