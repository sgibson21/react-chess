import { useEffect, useState } from 'react';
import './Board.css';
import { file, rank } from './types';
import { SquareEl } from './SquareEl';
import { CustomDragLayer } from './CustomDragLayer';
import { PieceGrid } from './PieceGrid';
import { useDispatch } from 'react-redux';
import { setBoard } from '../app/pieceLocationSlice';
import {
    back, forward, clearActiveSq, getActiveSquare, getLocatedPieces, getSquare,
    getSquareByPieceID, hasActiveSq, isActiveSq, isAvailableSquare, isOwnPiece,
    movePieceTo, setActiveSquare, BoardInternalState, files, ranks, isValidMove,
    promotePiece, readyForActiveSquareSelection, switchPlayer, LocatedPiece
} from './board-utils';
import { Square } from './square';
import { Socket } from 'socket.io-client';
import useHistory from './hooks/useHistory';
import { OnPromotionCallback } from './MovablePiece';

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

    useHistory(boardState, () => {
        setAnimate(true);
        makeMove(back(boardState));
    }, () => {
        setAnimate(true);
        makeMove(forward(boardState));
    });

    useEffect(() => {
        socket.on('state-update', res => {
            console.log('state update from web socket:', res);
            setBoardState(res);
        });

    }, []);

    // ======================================
    //              Web Sockets
    // ======================================
    const useWebSockets: boolean = true;
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

    const onPromotion: OnPromotionCallback = (selection, coord) => {
        if (selection === 'cancel') {
            makeMove(
                switchPlayer(
                    // go back (which switches player),
                    // then switch back to the same player
                    // as they are canceling thier move
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
                    ranks.map((r, i) => {
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
