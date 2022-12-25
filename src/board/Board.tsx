import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import classNames from 'classnames';
import '../board/Board.css';
import { file, pieceColor, rank } from './types';
import { Square } from './Square';
import { CustomDragLayer } from './CustomDragLayer';
import { dispatch as appDispatch } from '../app/store';
import {
    isActiveSq, readyForActiveSquareSelection, isOwnPiece,
    isValidMove, getMoves, move, getPromotionMove, hasActiveSq, isPromotionMoveIntent
} from './utils/board-utils';
import { MovablePiece, OnPromotionCallback } from './MovablePiece';
import { getCoordinates } from './utils/square-utils';
import { CANCEL_PROMOTION, CLEAR_ACTIVE_SQUARE, PLAY_PROMOTION_INTENT, SET_ACTIVE_SQUARE, useSelectRenderOrder } from '../app/boardStateSlice';
import { SET_ANIMATION } from '../app/animationSlice';

export type BoardOptions = {

    /**
     * Describes if the board should be flipped for players taking turns in local play
     */
    allowFlip?: boolean;

    /**
     * Describes the side this player is playing as, as part of an online game.
     * Governs:
     *      - which side the board should be facing
     *      - what color the player can play as
     */
    side?: pieceColor;
};

type BoardProps = {
    dispatchMoves: (moves: move[]) => void;
    options: BoardOptions;
};

export const Board = ({dispatchMoves, options}: BoardProps) => {

    const { allowFlip, side } = options;

    const [files, ranks] = useSelectRenderOrder(allowFlip, side);

    const boardClassNames: string = classNames({
        [`side-${side}`]: !!side
    });

    const handleMoves = (file: file, rank: rank, animate: boolean) => {
        appDispatch((dispatch, getState) => {
            
            const board = getState().boardState.board;
            
            // TODO: might not need isValidMove check..?
            if (isValidMove(file, rank, board) && board.activeSq) {
                dispatch(SET_ANIMATION(animate));
                const moves = getMoves(
                    getCoordinates(board.activeSq),
                    { file, rank },
                    board
                );
    
                if (isPromotionMoveIntent(moves[0], board)) {
                    dispatch(PLAY_PROMOTION_INTENT(moves[0]));
                } else {
                    dispatchMoves(moves);
                }
            }
        });

    };

    const squareClicked = (file: file, rank: rank) => {
        handleMoves(file, rank, true);
    };

    const pieceClicked = (file: file, rank: rank) => {
        appDispatch((dispatch, getState) => {

            const board = getState().boardState.board;

            // set active piece if they've clicked their own piece and it's their turn
            if (readyForActiveSquareSelection(file, rank, board, side)) {
                dispatch(SET_ACTIVE_SQUARE({file, rank}));
            }
            // clear the active square if it's active and they've clicked it again
            else if (hasActiveSq(board) && isActiveSq(file, rank, board)) {
                dispatch(CLEAR_ACTIVE_SQUARE());
            }
            else {
                handleMoves(file, rank, true);
            }
        });
    };

    const dragStart = (file: file, rank: rank) => {
        appDispatch((dispatch, getState) => {

            const board = getState().boardState.board;

            // set active piece if they've clicked their own piece and it's their turn
            if (readyForActiveSquareSelection(file, rank, board, options.side)) {
                dispatch(SET_ACTIVE_SQUARE({file, rank}));
            }
            else if (!isOwnPiece(file, rank, board)) {
                dispatch(CLEAR_ACTIVE_SQUARE());
            }
        });
    };

    const onDrop = (file: file, rank: rank) => {
        handleMoves(file, rank, false);
    };

    const onPromotion: OnPromotionCallback = (selection, coord) => {
        appDispatch((dispatch, getState) => {

            const board = getState().boardState.board;

            if (selection === 'cancel') {
                dispatch(SET_ANIMATION(true));
                dispatch(CANCEL_PROMOTION(coord));
            } else if (board.promotionIntent) {
                dispatch(SET_ANIMATION(false));
                const {from, to} = board.promotionIntent;
                dispatchMoves(
                    getPromotionMove(from, to, selection)
                );
            }
        });
    };

    return (
        <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
            <div className={`board ${boardClassNames}`}>
                <CustomDragLayer />

                {
                    ranks.map((rank, rankIndex) => (
                        <div key={rank} className="rank">
                            {files.map((file, fileIndex) => (
                                <Square
                                    key={`square-${file}-${rank}`}
                                    file={file}
                                    rank={rank}
                                    showFileLabel={fileIndex === 0}
                                    showRankLabel={rankIndex === 7}
                                    onClick={() => squareClicked(file, rank)}
                                    onDrop={() => onDrop(file, rank)}
                                />
                            ))}
                        </div>
                    ))
                }

                {
                    // there's never more than 32 pieces
                    Array(32).fill(0).map((_, i) => (
                        <MovablePiece
                            key={i}
                            pieceId={`${i}`}
                            side={side}
                            onClick={pieceClicked}
                            onDragStart={dragStart}
                            onDrop={(file, rank) => onDrop(file, rank)}
                            onPromotion={onPromotion}
                        />
                    ))
                }

            </div>
        </DndProvider>
    );

}
