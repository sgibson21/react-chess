import { useEffect } from 'react';
import '../board/Board.css';
import { file, pieceColor, rank } from './types';
import { Square } from './Square';
import { CustomDragLayer } from './CustomDragLayer';
import { useDispatch } from 'react-redux';
import { setPieceLocations } from '../app/pieceLocationSlice';
import {
    getActiveSquare, getLocatedPieces, getSquare, isActiveSq, isAvailableSquare, BoardState, 
    LocatedPiece, getBoardRenderOrder, readyForActiveSquareSelection, setActiveSquare, isOwnPiece,
    clearActiveSq, isValidMove, getMoves, move, playMoves, cancelPromotion, getPromotionMove, hasActiveSq
} from './utils/board-utils';
import { MovablePiece, OnPromotionCallback } from './MovablePiece';
import { DndProvider } from 'react-dnd';
import classNames from 'classnames';
import { TouchBackend } from 'react-dnd-touch-backend';
import { getCoordinates } from './utils/square-utils';

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
    boardState: BoardState;
    setBoardState: (state: BoardState) => void;
    dispatchMoves: (moves: move[]) => void; // TODO
    animate: boolean;
    setAnimate: (animate: boolean) => void;
    options?: BoardOptions;
};

export const defaultBoardOptions: BoardOptions = {
    allowFlip: false,
    side: 'white'
};

export const Board = ({
    boardState, setBoardState, dispatchMoves, animate, setAnimate, options = defaultBoardOptions}: BoardProps) => {

    const { allowFlip, side } = options;

    // pieces need to be in a consistent order - not in the order they appear on the board
    // same pieces in the same order each time so react knows not to rerender (actually in the dom) a piece just because it moves
    const pieces = getLocatedPieces(boardState).sort((a: LocatedPiece, b: LocatedPiece) => a.piece.id.localeCompare(b.piece.id));

    const mapLocatedPiecesToLocatedIDs = (lp: LocatedPiece) => ({file: lp.file, rank: lp.rank, id: lp.piece.id});
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPieceLocations(pieces.map(mapLocatedPiecesToLocatedIDs)));
    }, [pieces]);

    const [files, ranks] = getBoardRenderOrder(boardState.playersTurn, allowFlip, side);

    const boardClassNames: string = classNames({
        'allow-flip': allowFlip ,
        [`side-${side}`]: !!side
    });

    const handleMoves = (file: file, rank: rank, animate: boolean) => {
        if (isValidMove(file, rank, boardState) && boardState.activeSq) {
            setAnimate(animate);
            const moves = getMoves(
                getCoordinates(boardState.activeSq),
                { file, rank },
                boardState
            );

            if (boardState.promotionIntent) {
                setBoardState(
                    playMoves(moves, boardState)
                );
            } else {
                dispatchMoves(moves);
            }
        }
    };

    const squareClicked = (file: file, rank: rank) => {
        handleMoves(file, rank, true);
    };

    const pieceClicked = (file: file, rank: rank) => {
        // set active piece if they've clicked their own piece and it's their turn
        if (readyForActiveSquareSelection(file, rank, boardState, side)) {
            setBoardState(
                setActiveSquare(file, rank, boardState)
            );
        }
        // clear the active square if it's active and they've clicked it again
        else if (hasActiveSq(boardState) && isActiveSq(file, rank, boardState)) {
            setBoardState(
                clearActiveSq(boardState)
            );
        }
        else {
            handleMoves(file, rank, true);
        }
    };

    const dragStart = (file: file, rank: rank) => {
        // set active piece if they've clicked their own piece and it's their turn
        if (readyForActiveSquareSelection(file, rank, boardState, options.side)) {
            setBoardState(
                setActiveSquare(file, rank, boardState)
            );
        }
        else if (!isOwnPiece(file, rank, boardState)) {
            setBoardState(
                clearActiveSq(boardState)
            );
        }
    };

    const onDrop = (file: file, rank: rank) => {
        handleMoves(file, rank, false);
    };

    const onPromotion: OnPromotionCallback = (selection, coord) => {
        if (selection === 'cancel') {
            setAnimate(true);
            setBoardState(
                cancelPromotion(coord, boardState)
            );
        } else if (boardState.promotionIntent) {
            setAnimate(false);
            const {from, to} = boardState.promotionIntent;
            dispatchMoves(
                getPromotionMove(from, to, selection)
            );
        }
    };

    /**
     * don't show what's active or available if it's not the current side's turn
     * 
     * TODO: ideally this info isnt sent over the socket but will do for now
     */
    const showPieceOptions = !side || side === boardState.playersTurn;

    return (
        <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
            <div className={`board player-${boardState.playersTurn} ${boardClassNames}`}>
                <CustomDragLayer activeSquare={getActiveSquare(boardState)}/>
                {
                    ranks.map((rank, rankIndex) => (
                        <div key={rank} className="rank">
                            {files.map((file, fileIndex) => (
                                <Square
                                    key={`square-${file}-${rank}`}
                                    square={getSquare(file, rank, boardState)}
                                    isActive={showPieceOptions && isActiveSq(file, rank, boardState)}
                                    isAvailable={showPieceOptions && isAvailableSquare(file, rank, boardState)}
                                    firstFile={fileIndex === 0}
                                    bottomRank={rankIndex === 7}
                                    onClick={() => squareClicked(file, rank)}
                                    onDrop={() => onDrop(file, rank)}
                                />
                            ))}
                        </div>
                    ))
                }

                {
                    pieces.map(location => (
                        <MovablePiece
                            key={location.piece.id}
                            piece={location.piece}
                            boardState={boardState}
                            side={side}
                            animate={animate}
                            onClick={pieceClicked}
                            onDragStart={dragStart}
                            onPromotion={onPromotion}
                        />
                    ))
                }

            </div>
        </DndProvider>
    );

}
