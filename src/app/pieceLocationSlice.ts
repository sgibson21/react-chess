import { createSlice } from '@reduxjs/toolkit';
import { file, rank } from '../board/types';

export const pieceLocationSlice = createSlice({
    name: 'pieceLocation',
    initialState: {} as any,
    reducers: {
        setBoard: (state, action: {payload: {file: file, rank: rank, id: string}[], type: string}) => {
            const locations = action.payload;
            locations.forEach(({file, rank, id}) => {
                // TODO: not sure how to clear the state?
                // state = {};
                state[id] = { file, rank };
            });
        }
    },
});

export const { setBoard } = pieceLocationSlice.actions;

export default pieceLocationSlice.reducer;
