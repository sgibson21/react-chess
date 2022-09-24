import { useEffect, useState } from 'react';
import './Board.css';
import { file, pieceColor, rank } from './types';
import { Square } from './Square';
import { CustomDragLayer } from './CustomDragLayer';
import { useDispatch } from 'react-redux';
import { setBoard } from '../app/pieceLocationSlice';
import {
    back, forward, clearActiveSq, getActiveSquare, getLocatedPieces, getSquare,
    getSquareByPieceID, hasActiveSq, isActiveSq, isAvailableSquare, isOwnPiece,
    movePieceTo, setActiveSquare, BoardState, isValidMove, LocatedPiece,
    promotePiece, readyForActiveSquareSelection, getBoardRenderOrder, cancelPromotion
} from './utils/board-utils';
import { getCoordinates, SquareState } from './utils/square-utils';
import { MovablePiece, OnPromotionCallback } from './MovablePiece';
import { DndProvider } from 'react-dnd';
import useHistory from './hooks/useHistory';
import classNames from 'classnames';
import { TouchBackend } from 'react-dnd-touch-backend';

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
    makeMove: (state: BoardState) => void;
    options?: BoardOptions;
};

const defaultBoardOptions: BoardOptions = {
    allowFlip: false,
    side: 'white'
};

export const Board = ({boardState, makeMove, options = defaultBoardOptions}: BoardProps) => {

    const { allowFlip, side } = options;

    const [animate, setAnimate] = useState(true);

    // pieces need to be in a consistent order - not in the order they appear on the board
    // same pieces in the same order each time so react knows not to rerender (actually in the dom) a piece just because it moves
    const pieces = getLocatedPieces(boardState).sort((a: LocatedPiece, b: LocatedPiece) => a.piece.id.localeCompare(b.piece.id));

    const mapLocatedPiecesToLocatedIDs = (lp: LocatedPiece) => ({file: lp.file, rank: lp.rank, id: lp.piece.id});
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setBoard(pieces.map(mapLocatedPiecesToLocatedIDs)));
    }, [pieces]);

    useHistory(boardState, () => {
        if (!side) {
            setAnimate(true);
            makeMove(back(boardState));
        }
    }, () => {
        if (!side) {
            setAnimate(true);
            makeMove(forward(boardState));
        }
    });

    const [files, ranks] = getBoardRenderOrder(boardState.playersTurn, allowFlip, side);

    const squareClicked = (file: file, rank: rank) => {
        setAnimate(true);
        // move the piece if there's an active piece and they havn't clicked their own piece
        if (isValidMove(file, rank, boardState) && boardState.activeSq) {
            makeMove(
                movePieceTo(getCoordinates(boardState.activeSq), {file, rank}, boardState)
            );
        }
    };
    
    const pieceClicked = (file: file, rank: rank) => {
        // set active piece if they've clicked their own piece and it's their turn
        if (readyForActiveSquareSelection(file, rank, boardState, side)) {
            makeMove(
                setActiveSquare(file, rank, boardState)
            );
        }
        // clear the active square if it's active and they've clicked it again
        else if (hasActiveSq(boardState) && isActiveSq(file, rank, boardState)) {
            makeMove(
                clearActiveSq(boardState)
            );
        }
        // move the piece if there's an active piece and they havn't clicked their own piece
        else if (isValidMove(file, rank, boardState) && boardState.activeSq) {
            setAnimate(true);
            makeMove(
                movePieceTo(getCoordinates(boardState.activeSq), {file, rank}, boardState)
            );
        }
    };
    
    const dragStart = (file: file, rank: rank) => {
        // set active piece if they've clicked their own piece and it's their turn
        if (readyForActiveSquareSelection(file, rank, boardState, side)) {
            makeMove(
                setActiveSquare(file, rank, boardState)
            );
        }
        else if (!isOwnPiece(file, rank, boardState)) {
            makeMove(
                clearActiveSq(boardState)
            );
        }
    };
    
    const onDrop = (file: file, rank: rank) => {
        setAnimate(false);
        if (boardState.activeSq) {
            makeMove(
                movePieceTo(getCoordinates(boardState.activeSq), {file, rank}, boardState)
            );
        }
    };
    
    const onCapture = (pieceID: string) => {
        const toSquare: SquareState | undefined = getSquareByPieceID(pieceID, boardState);
        if (boardState.activeSq && toSquare) {
            setAnimate(false);
            makeMove(
                movePieceTo(getCoordinates(boardState.activeSq), {file: toSquare.file, rank: toSquare.rank}, boardState)
            );
        }
    };

    const onPromotion: OnPromotionCallback = (selection, coord) => {
        if (selection === 'cancel') {
            makeMove(
                cancelPromotion(boardState)
            );
        } else if (coord) {
            makeMove(
                promotePiece(coord, selection, boardState)
            );
        }
    };

    const boardClassNames: string = classNames({
        'allow-flip': allowFlip ,
        [`side-${side}`]: !!side
    });

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
                            onCapture={onCapture}
                            onPromotion={onPromotion}
                        />
                    ))
                }

            </div>
        </DndProvider>
    );

}
