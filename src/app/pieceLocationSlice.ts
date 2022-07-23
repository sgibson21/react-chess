import { createSlice } from '@reduxjs/toolkit';
import { LocatedPiece } from '../board/Board';
import { file, rank } from '../board/types';

export const pieceLocationSlice = createSlice({
    name: 'pieceLocation',
    initialState: {} as any,
    reducers: {
        moveTo: (state, {payload, type}: {payload: {file: file, rank: rank}, type: string}) => {
            console.log('moving to', payload)
            state.file = payload.file;
            state.rank = payload.rank;
        },
        setBoard: (state, action: {payload: {file: file, rank: rank, id: string}[], type: string}) => {
            const locations = action.payload;
            locations.forEach(({file, rank, id}) => {
                // TODO: not sure how to clear the state?
                // state = {};
                state[id] = { file, rank };
            });
        },
        movePiece: (state, action: any) => {
            if (!action.payload.id) {
                console.log('no ID!');
                return;
            }
            state[action.payload.id] = {
                file: action.payload.file,
                rank: action.payload.rank
            };
            console.log('pieces updated:', action, JSON.parse(JSON.stringify(state)));
        }
    },
});

export const { moveTo, setBoard, movePiece } = pieceLocationSlice.actions;

export default pieceLocationSlice.reducer;
