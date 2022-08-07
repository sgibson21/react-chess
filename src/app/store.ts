import { configureStore } from '@reduxjs/toolkit';
import pieceLocationReducer from './pieceLocationSlice';

export default configureStore({
    reducer: {
        pieceLocation: pieceLocationReducer
    },
});
