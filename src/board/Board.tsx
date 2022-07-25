import { useEffect, useState } from 'react';
import { BoardInternalState, files } from './board-utils';
import './Board.css';
import './PieceGrid.css';
import { file, rank } from './types';
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

    const useWebSockets: boolean = true;

    const makeMove = (state: BoardInternalState) => {
        if (useWebSockets) {
            socket.emit('state-change', state);
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

    useEffect(() => {
        document.addEventListener('keydown', historyListener);

        // clean up
        return () => document.removeEventListener('keydown', historyListener);
    }, [boardState, setBoardState]);

    useEffect(() => {
        socket.on('state-update', res => {
            console.log('state update from web socket:', res);
            setBoardState(res);
        });

        return () => {
            socket.off('state-update');
        }
    }, [setBoardState, boardState]);

    const squareClicked = (file: file, rank: rank) => {
        setAnimate(true);
        // move the piece if there's an active piece and they havn't clicked their own piece
        if (hasActiveSq(boardState) && !isOwnPiece(file, rank, boardState)) {
            const state = movePieceTo({file, rank}, boardState);
            makeMove(state);
        }
    };
    
    const pieceClicked = (file: file, rank: rank) => {
        // set active piece if they've clicked their own piece and it's their turn
        if (isOwnPiece(file, rank, boardState) && !isActiveSq(file, rank, boardState)) {
            const state = setActiveSquare(file, rank, boardState);
            makeMove(state);
        }
        // clear the active square if it's active and they've clicked it again
        else if (hasActiveSq(boardState) && isActiveSq(file, rank, boardState)) {
            const state = clearActiveSq(boardState);
            makeMove(state);
        }
        // move the piece if there's an active piece and they havn't clicked their own piece
        else if (hasActiveSq(boardState) && !isOwnPiece(file, rank, boardState)) {
            setAnimate(true);
            const state = movePieceTo({file, rank}, boardState);
            makeMove(state);
        }
    };
    
    const dragStart = (file: file, rank: rank) => {
        // set active piece if they've clicked their own piece and it's their turn
        if (isOwnPiece(file, rank, boardState) && !isActiveSq(file, rank, boardState)) {
            const state = setActiveSquare(file, rank, boardState);
            makeMove(state);
        }
        else if (!isOwnPiece(file, rank, boardState)) {
            const state = clearActiveSq(boardState);
            makeMove(state);
        }
    };
    
    const onDrop = (file: file, rank: rank) => {
        const state = movePieceTo({file, rank}, boardState);
        makeMove(state);
        setAnimate(false);
    };
    
    const onCapture = (pieceID: string) => {
        const toSquare: Square | undefined = getSquareByPieceID(pieceID, boardState);
        if (toSquare) {
            const state = movePieceTo({file: toSquare.file, rank: toSquare.rank}, boardState);
            makeMove(state);
            setAnimate(false);
        }
    }

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
                ></PieceGrid>

            </div>
        </>
    );

}
