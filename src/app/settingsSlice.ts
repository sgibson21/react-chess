import { createSlice } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';

export const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        gameOverWindowClosed: false
    },
    reducers: {
        SET_GAME_OVER_WINDOW_CLOSED: (state, action: {payload: boolean}) => {
            state.gameOverWindowClosed = action.payload;
        }
    },
});

export const { SET_GAME_OVER_WINDOW_CLOSED } = settingsSlice.actions;

export const useGameOverWindowClosed = () => {
    return useSelector((state: any) => state.settings.gameOverWindowClosed);
};

export default settingsSlice.reducer;
