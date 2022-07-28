import { useEffect, useState } from 'react';
import { BoardInternalState, files, isValidMove, promotePiece, readyForActiveSquareSelection, switchPlayer } from './board-utils';
import './Board.css';
import { coord, file, pieceType, rank } from './types';
import { SquareEl } from './SquareEl';
import { CustomDragLayer } from './CustomDragLayer';
import { Piece } from '../pieces/piece';
import { PieceGrid } from './PieceGrid';
import { useDispatch } from 'react-redux';
import { setBoard } from '../app/pieceLocationSlice';
import {
    back,
    clearActiveSq,
    forward,
    getActiveSquare,
    getLocatedPieces,
    getSquare,
    getSquareByPieceID,
    hasActiveSq,
    isActiveSq,
    isAvailableSquare,
    isOwnPiece,
    movePieceTo,
    setActiveSquare
} from './board-utils';
import { Square } from './square';
import { Socket } from 'socket.io-client';

const board: file[][] = [
    files,
    files,
    files,
    files,
    files,
    files,
    files,
    files,
];

export type LocatedPiece = {
    file: file;
    rank: rank;
    piece: Piece;
};

export const Board = ({initialState, socket}: {initialState: BoardInternalState, socket: Socket}) => {

    const [boardState, setBoardState] = useState<BoardInternalState>(initialState);
    const [animate, setAnimate] = useState(true);

    // pieces need to be in a consistent order - not in the order they appear on the board
    // same pieces in the same order each time so react knows not to rerender (actually in the dom) a piece just because it moves
    const pieces = getLocatedPieces(boardState).sort((a: LocatedPiece, b: LocatedPiece) => a.piece.id.localeCompare(b.piece.id));

    const mapLocatedPiecesToLocatedIDs = (lp: LocatedPiece) => ({file: lp.file, rank: lp.rank, id: lp.piece.id});
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setBoard(pieces.map(mapLocatedPiecesToLocatedIDs)));
    }, [pieces]);

    // TODO: make custom hook
    useEffect(() => {
        document.addEventListener('keydown', historyListener);

        // clean up
        return () => document.removeEventListener('keydown', historyListener);
    }, [boardState, setBoardState]);

    // TODO: make custom hook
    useEffect(() => {
        socket.on('state-update', res => {
            console.log('state update from web socket:', res);
            setBoardState(res);
        });

        return () => {
            socket.off('state-update');
        }
    }, [setBoardState, boardState]);

    const useWebSockets: boolean = false;

    const makeMove = (state: BoardInternalState) => {
        if (useWebSockets) {
            socket.emit('state-change', state, (res: {status: number}) => {
                if (res.status === 200) {
                    setBoardState(state);
                }
            });
        } else {
            setBoardState(state);
        }
    };

    const historyListener = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
            setAnimate(true);
            const state = forward(boardState);
            makeMove(state);
        } else if (e.key === 'ArrowLeft') {
            setAnimate(true);
            const state = back(boardState);
            makeMove(state);
        }
    };

    const squareClicked = (file: file, rank: rank) => {
        setAnimate(true);
        // move the piece if there's an active piece and they havn't clicked their own piece
        if (isValidMove(file, rank, boardState)) {
            makeMove(
                movePieceTo({file, rank}, boardState)
            );
        }
    };
    
    const pieceClicked = (file: file, rank: rank) => {
        // set active piece if they've clicked their own piece and it's their turn
        if (readyForActiveSquareSelection(file, rank, boardState)) {
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
        else if (isValidMove(file, rank, boardState)) {
            setAnimate(true);
            makeMove(
                movePieceTo({file, rank}, boardState)
            );
        }
    };
    
    const dragStart = (file: file, rank: rank) => {
        // set active piece if they've clicked their own piece and it's their turn
        if (readyForActiveSquareSelection(file, rank, boardState)) {
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
        makeMove(
            movePieceTo({file, rank}, boardState)
        );
    };
    
    const onCapture = (pieceID: string) => {
        const toSquare: Square | undefined = getSquareByPieceID(pieceID, boardState);
        if (toSquare) {
            setAnimate(false);
            makeMove(
                movePieceTo({file: toSquare.file, rank: toSquare.rank}, boardState)
            );
        }
    };

    const onPromotion = (selection: pieceType | 'cancel', coord: coord | null) => {
        if (selection === 'cancel') {
            // go back (which switches player), then switch back to the same player, as they are canceling thier move
            makeMove(
                switchPlayer(
                    back(boardState)
                )
            );
        } else if (coord) {
            makeMove(
                promotePiece(coord, selection, boardState)
            );
        }
    };

    return (
        <>
            <CustomDragLayer activeSquare={getActiveSquare(boardState)}/>
            <div className="board">
                {
                    board.map((r, i) => {
                        const rank: rank = 8 - i as rank;
                        return (
                            <div key={rank} className="rank">
                                {files.map(file => (
                                    <SquareEl 
                                        key={`square-${file}-${rank}`}
                                        square={getSquare(file, rank, boardState)}
                                        onClick={() => squareClicked(file, rank)}
                                        isActive={isActiveSq(file, rank, boardState)}
                                        isAvailable={isAvailableSquare(file, rank, boardState)}
                                        onDrop={() => onDrop(file, rank)}
                                    />
                                ))}
                            </div>
                        )
                    })
                }

                <PieceGrid
                    locations={pieces}
                    onClick={(file, rank) => pieceClicked(file, rank)}
                    onDragStart={(file, rank) => dragStart(file, rank)}
                    onCapture={pieceID => onCapture(pieceID)}
                    animate={animate}
                    boardState={boardState}
                    onPromotion={onPromotion}
                ></PieceGrid>

            </div>
        </>
    );

}
