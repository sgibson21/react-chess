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

type RankData = {
    rank: rank;
    boardState: BoardInternalState;
    squareClicked: (file: file, rank: rank) => void;
    dragStart: (file: file, rank: rank) => void;
};

export type LocatedPiece = {
    file: file;
    rank: rank;
    piece: Piece;
};

const squareClicked = (file: file, rank: rank, boardState: BoardInternalState, setBoardState: (state: BoardInternalState) => void, setAnimate: (animate: boolean) => void) => {
    setAnimate(true);
    // move the piece if there's an active piece and they havn't clicked their own piece
    if (hasActiveSq(boardState) && !isOwnPiece(file, rank, boardState)) {
        setBoardState(movePieceTo({file, rank}, boardState));
    }
};

const pieceClicked = (file: file, rank: rank, boardState: BoardInternalState, setBoardState: (state: BoardInternalState) => void, setAnimate: (animate: boolean) => void) => {
    // set active piece if they've clicked their own piece and it's their turn
    if (isOwnPiece(file, rank, boardState) && !isActiveSq(file, rank, boardState)) {
        setBoardState(setActiveSquare(file, rank, boardState));
    }
    // clear the active square if it's active and they've clicked it again
    else if (hasActiveSq(boardState) && isActiveSq(file, rank, boardState)) {
        setBoardState(clearActiveSq(boardState));
    }
    // move the piece if there's an active piece and they havn't clicked their own piece
    else if (hasActiveSq(boardState) && !isOwnPiece(file, rank, boardState)) {
        setAnimate(true);
        setBoardState(movePieceTo({file, rank}, boardState));
    }
};

const dragStart = (file: file, rank: rank, boardState: BoardInternalState, setBoardState: (state: BoardInternalState) => void) => {
    // set active piece if they've clicked their own piece and it's their turn
    if (isOwnPiece(file, rank, boardState) && !isActiveSq(file, rank, boardState)) {
        setBoardState(setActiveSquare(file, rank, boardState));
    }
    else if (!isOwnPiece(file, rank, boardState)) {
        setBoardState(clearActiveSq(boardState));
    }
};

const onDrop = (file: file, rank: rank, boardState: BoardInternalState, setBoardState: (state: BoardInternalState) => void, setAnimate: (animate: boolean) => void) => {
    setBoardState(movePieceTo({file, rank}, boardState));
    setAnimate(false);
};

const onCapture = (pieceID: string, boardState: BoardInternalState, setBoardState: (state: BoardInternalState) => void, setAnimate: (animate: boolean) => void) => {
    const toSquare: Square | undefined = getSquareByPieceID(pieceID, boardState);
    if (toSquare) {
        setBoardState(movePieceTo({file: toSquare.file, rank: toSquare.rank}, boardState));
        setAnimate(false);
    }
}

export const Board = ({state}: {state: BoardInternalState}) => {

    const [boardState, setBoardState] = useState<BoardInternalState>(state);
    const [animate, setAnimate] = useState(true);

    // pieces need to be in a consistent order - not in the order they appear on the board
    // same pieces in the same order each time so react knows not to rerender (actually in the dom) a piece just because it moves
    const pieces = getLocatedPieces(boardState).sort((a: LocatedPiece, b: LocatedPiece) => a.piece.id.localeCompare(b.piece.id));

    const mapLocatedPiecesToLocatedIDs = (lp: LocatedPiece) => ({file: lp.file, rank: lp.rank, id: lp.piece.id});
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setBoard(pieces.map(mapLocatedPiecesToLocatedIDs)));
    }, [pieces]);

    const historyListener = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
            setAnimate(true);
            setBoardState(forward(boardState));
        } else if (e.key === 'ArrowLeft') {
            setAnimate(true);
            setBoardState(back(boardState));
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', historyListener);

        // clean up
        return () => document.removeEventListener('keydown', historyListener);
    }, [boardState, setBoardState]);

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
                                        onClick={() => squareClicked(file, rank, boardState, setBoardState, setAnimate)}
                                        isActive={isActiveSq(file, rank, boardState)}
                                        isAvailable={isAvailableSquare(file, rank, boardState)}
                                        onDrop={() => onDrop(file, rank, boardState, setBoardState, setAnimate)}
                                    />
                                ))}
                            </div>
                        )
                    })
                }

                <PieceGrid
                    locations={pieces}
                    onClick={(file, rank) => pieceClicked(file, rank, boardState, setBoardState, setAnimate)}
                    onDragStart={(file, rank) => dragStart(file, rank, boardState, setBoardState)}
                    onCapture={pieceID => onCapture(pieceID, boardState, setBoardState, setAnimate)}
                    animate={animate}
                    boardState={boardState}
                ></PieceGrid>

            </div>
        </>
    );

}
