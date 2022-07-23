import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';
import pieceLocationReducer from './pieceLocationSlice';

export default configureStore({
    reducer: {
        counter: counterReducer,
        pieceLocation: pieceLocationReducer
    },
});
