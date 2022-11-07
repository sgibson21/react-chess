import { createSlice } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { coord, pieceColor } from '../board/types';
import {
    back, BoardState, cancelPromotion, clearActiveSq, forward, getBoardRenderOrder,
    isActiveSq, isAvailableSquare, move, playMoves, setActiveSquare
} from '../board/utils/board-utils';
import { SquareState } from '../board/utils/square-utils';

export const boardStateSlice = createSlice({
    name: 'boardState',
    initialState: {} as any,
    reducers: {
        setboardState: (state, action: {payload: BoardState, type: string}) => {
            const board: BoardState = action.payload;
            state.board = board;
        },
        PLAY_MOVES: (state, action: {payload: move[], type: string}) => {
            state.board = playMoves(action.payload, state.board);
        },
        SET_ACTIVE_SQUARE: (state, action: {payload: coord, type: string}) => {
            const { file, rank } = action.payload;
            state.board = setActiveSquare(file, rank, state.board);
        },
        CLEAR_ACTIVE_SQUARE: (state) => {
            state.board = clearActiveSq(state.board);
        },
        PLAY_PROMOTION_INTENT: (state, action: {payload: move}) => {
            state.board.promotionIntent = action.payload;
            state.board = playMoves([action.payload], state.board);
        },
        CANCEL_PROMOTION: (state, action: {payload: coord}) => {
            state.board = cancelPromotion(action.payload, state.board);
        },
        BACK: state => {
            state.board = back(state.board);
        },
        FORWARD: state => {
            state.board = forward(state.board)
        }
    },
});

export const {
    setboardState,
    PLAY_MOVES,
    SET_ACTIVE_SQUARE,
    CLEAR_ACTIVE_SQUARE,
    PLAY_PROMOTION_INTENT,
    CANCEL_PROMOTION,
    BACK,
    FORWARD
} = boardStateSlice.actions;

export const useSquare: ({ file, rank }: coord) => SquareState = ({ file, rank }: coord) => {
    return useSelector((state: any) => {
        if (file && rank) {
            return state.boardState.board.squares[file][rank];
        }
    });
};

export const useSquareFromPieceId = (pieceId: string | undefined) => {
    return useSelector((state: any) => {

        if (!pieceId) {
            return;
        }

        const coordString: string = state.boardState.board.pieceLocations[pieceId];

        // piece with ID is no longer on the board
        if (!coordString) {
            return;
        }

        const file = coordString[0];
        const rank = coordString[1];

        if (file && rank) {
            return state.boardState.board.squares[file][rank];
        }
    });
}

export const useActiveSquare = () => {
    return useSelector((state: any) => {
        return state.boardState.board.activeSq;
    });
};

export const useIsActiveSquare = ({ file, rank }: coord) => {
    return useSelector((state: any) => {
        return isActiveSq(file, rank, state.boardState.board);
    });
};

export const useIsAvailableSquare = ({ file, rank }: coord) => {
    return useSelector((state: any) => {
        return isAvailableSquare(file, rank, state.boardState.board);
    });
};

export const useSelectRenderOrder = (allowFlip?: boolean, side?: pieceColor) => {
    return useSelector((state: any) => {
        return getBoardRenderOrder(state.boardState.board.playersTurn, allowFlip, side);
    });
};

export const usePlayerTurn: () => pieceColor = () => useSelector((state: any) => {
    return state.boardState.board.playersTurn;
});

export const usePlayerTurnIfSide: (side: pieceColor | undefined) => pieceColor = (side: pieceColor | undefined) => useSelector((state: any) => {
    if (side) {
        return state.boardState.board.playersTurn;
    }
});

export const useWinner = () => useSelector((state: any) => {
    return state?.boardState?.board?.winner;
});

export default boardStateSlice.reducer;
