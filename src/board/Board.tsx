// import React from 'react';
// import { BoardState, files } from './board-state';
// import './Board.css';
// import './PieceGrid.css';
// import { file, rank } from './types';
// import { DndProvider } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';
// import { SquareEl } from './SquareEl';
// import { CustomDragLayer } from './CustomDragLayer';
// import { Square } from './square';
// import { DraggablePiece } from './DraggablePiece';
// import { Piece } from '../pieces/piece';
// import { PieceGrid } from './PieceGrid';
// import { MovablePiece } from './MovablePiece';
// import { useDispatch } from 'react-redux';
// import { movePiece } from '../app/pieceLocationSlice';

// const board: file[][] = [
//     files,
//     files,
//     files,
//     files,
//     files,
//     files,
//     files,
//     files,
// ];

// type BoardComponentState = {
//     board: BoardState;
//     pieces: LocatedPiece[];
// };

// export type LocatedPiece = {
//     file: file;
//     rank: rank;
//     piece: Piece;
// };

// export class Board extends React.Component<{}, BoardComponentState> {

//     private historyListener = (e: KeyboardEvent) => {
//         if (e.key === 'ArrowRight') {
//             // this.setState({ board: this.state.board.forward() });
//             this.setState({ pieces: this.state.board.forward() });
//         } else if (e.key === 'ArrowLeft') {
//             // this.setState({ board: this.state.board.back() });
//             this.setState({ pieces: this.state.board.back() });
//         }
//     };

//     constructor(props: any) {
//         super(props);

//         this.state = {
//             board: new BoardState(),
//             pieces: []
//         };

//     }

//     componentDidMount() {
//         document.addEventListener('keydown', this.historyListener);
//     }
  
//     componentWillUnmount() {
//         document.removeEventListener('keydown', this.historyListener);
//     }

//     // TODO: try to put the drag and drop provider over an invisible grid that contain the pieces
//     //       and render the board separately
//     //       This is to get the transition working for non click and drag moves
//     //       You want the grid to be used to tell you the coords and then update the position of
//     //       the fixed piece dom element so a transition can see a start and end position.
//     render() {
//         // const locatedPieces: LocatedPiece[] = this.getLocatedPieces();

//         return (
//             <DndProvider backend={HTML5Backend}>
//                 <CustomDragLayer getPiece={(file, rank) => this.state.board.getSquare(file, rank).piece as Piece}/>
//                 <div className="board">

//                     {
//                         board.map((r, i) => this.rankEl(8 - i as rank))
//                     }

//                     {/* <PieceGrid
//                         board={this.state.board}
//                         locations={locatedPieces}
//                         setBoard={(board: BoardState) => this.setState({ board })}
//                     ></PieceGrid> */}

//                 </div>
//             </DndProvider>
//         );
//     }

//     private squareClicked (file: file, rank: rank) {
//         // const dispatch = useDispatch();
//         const setPieces = (pieces: LocatedPiece[]) => this.setState({ pieces });
//         // set active piece if they've clicked their own piece and it's their turn
//         if (this.state.board.isOwnPiece(file, rank) && !this.state.board.isActiveSq(file, rank)) {
//             setPieces(this.state.board.setActiveSquare(file, rank));
//         }
//         // clear the active square if it's active and they've clicked it again
//         else if (this.state.board.hasActiveSq() && this.state.board.isActiveSq(file, rank)) {
//             setPieces(this.state.board.clearActiveSq());
//         }
//         // move the piece if there's an active piece and they havn't clicked their own piece
//         if (this.state.board.hasActiveSq() && !this.state.board.isOwnPiece(file, rank)) {
//             setPieces(this.state.board.movePieceTo({file, rank}));

//             // dispatch(moveTo({file, rank})); // Redux
//             // dispatch(movePiece({ id: this.state.board.getSquare(file, rank).piece?.id, file, rank}));
//         }
//     }

//     private dragStart(file: file, rank: rank) {
//         // const dispatch = useDispatch();
//         const setPieces = (pieces: LocatedPiece[]) => this.setState({ pieces });
//         // set active piece if they've clicked their own piece and it's their turn
//         if (this.state.board.isOwnPiece(file, rank) && !this.state.board.isActiveSq(file, rank)) {
//             setPieces(this.state.board.setActiveSquare(file, rank));

//             // dispatch(moveTo({file, rank})); // Redux
//             // dispatch(movePiece({ id: this.state.board.getSquare(file, rank).piece?.id, file, rank}));
//         }
//     }

//     private rankEl(rank: rank) {
//         const setPieces = (pieces: LocatedPiece[]) => this.setState({ pieces });
//         return (
//             <div key={rank} className="rank">
//                 {files.map(file => (
//                     <SquareEl 
//                         key={`square-${file}-${rank}`}
//                         square={this.state.board.getSquare(file, rank)}
//                         onSquareClick={(file, rank) => this.squareClicked(file, rank)}
//                         onDragStart={(file, rank) => this.dragStart(file, rank)}
//                         isActive={this.state.board.isActiveSq(file, rank)}
//                         isAvailable={this.state.board.isAvailableSquare(file, rank)}
//                         onDrop={() => setPieces(this.state.board.movePieceTo({file, rank}))}
//                     />
//                 ))}
//             </div>
//         );
//     }

// }


// import React, { useEffect, useState } from 'react';
// import { BoardState, files } from './board-state';
// import './Board.css';
// import './PieceGrid.css';
// import { file, rank } from './types';
// import { DndProvider } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';
// import { SquareEl } from './SquareEl';
// import { CustomDragLayer } from './CustomDragLayer';
// import { Square } from './square';
// import { DraggablePiece } from './DraggablePiece';
// import { Piece } from '../pieces/piece';
// import { PieceGrid } from './PieceGrid';
// import { MovablePiece } from './MovablePiece';
// import { useDispatch } from 'react-redux';
// import { movePiece, setBoard } from '../app/pieceLocationSlice';

// const board: file[][] = [
//     files,
//     files,
//     files,
//     files,
//     files,
//     files,
//     files,
//     files,
// ];

// export type LocatedPiece = {
//     file: file;
//     rank: rank;
//     piece: Piece;
// };

// export const Board = () => {
    
//     const [boardState, setBoardState] = useState(new BoardState());
//     const [pieces, setPieces] = useState<LocatedPiece[]>(boardState.getLocatedPieces());

//     const mapLocatedPiecesToLocatedIDs = (lp: LocatedPiece) => ({file: lp.file, rank: lp.rank, id: lp.piece.id});

//     const historyListener = (e: KeyboardEvent) => {
//         console.log('here');
//         if (e.key === 'ArrowRight') {
//             // setPieces(boardState.forward());
//             dispatch(setBoard(boardState.forward().map(mapLocatedPiecesToLocatedIDs)));
//         } else if (e.key === 'ArrowLeft') {
//             // setPieces(boardState.back());
//             dispatch(setBoard(boardState.back().map(mapLocatedPiecesToLocatedIDs)));
//         }
//     };

//     useEffect(() => {
//         console.log('hello')
//         document.addEventListener('keydown', historyListener);

//         // clean up
//         return () => document.removeEventListener('keydown', historyListener);
//     }, []);

//     const dispatch = useDispatch();

//     useEffect(() => {
//         // TODO: for each located piece, dispatch a 'movePiece' action to init the pieces on the board
//         // pieces.forEach(({file, rank, piece}) => dispatch(movePiece({ id: piece.id, file, rank})));
//         dispatch(setBoard(pieces.map(mapLocatedPiecesToLocatedIDs)));
//     }, []);

//     const squareClicked = (file: file, rank: rank) => {
//         // set active piece if they've clicked their own piece and it's their turn
//         if (boardState.isOwnPiece(file, rank) && !boardState.isActiveSq(file, rank)) {
//             setPieces(boardState.setActiveSquare(file, rank));
//         }
//         // clear the active square if it's active and they've clicked it again
//         else if (boardState.hasActiveSq() && boardState.isActiveSq(file, rank)) {
//             setPieces(boardState.clearActiveSq());
//         }
//         // move the piece if there's an active piece and they havn't clicked their own piece
//         if (boardState.hasActiveSq() && !boardState.isOwnPiece(file, rank)) {
//             // setPieces(boardState.movePieceTo({file, rank}));

//             // dispatch(moveTo({file, rank})); // Redux
//             // dispatch(movePiece({ id: boardState.getSquare(file, rank).piece?.id, file, rank}));
//             dispatch(setBoard(boardState.movePieceTo({file, rank}).map(mapLocatedPiecesToLocatedIDs)));

//             // TODO: you need to dispatch a 'remove piece' action to remove pieces from the board
//         }
//     }

//     const dragStart = (file: file, rank: rank) => {
//         // set active piece if they've clicked their own piece and it's their turn
//         if (boardState.isOwnPiece(file, rank) && !boardState.isActiveSq(file, rank)) {
//             setPieces(boardState.setActiveSquare(file, rank));

//             // dispatch(moveTo({file, rank})); // Redux
//             dispatch(movePiece({ id: boardState.getSquare(file, rank).piece?.id, file, rank}));
//         }
//     }

//     return (
//         <DndProvider backend={HTML5Backend}>
//             {/* <CustomDragLayer getPiece={(file, rank) => boardState.getSquare(file, rank).piece as Piece}/> */}
//             <div className="board">

//                 {
//                     board.map((r, i) => rankEl(8 - i as rank, boardState, squareClicked, dragStart, setPieces))
//                 }

//                 <PieceGrid
//                     locations={pieces}
//                     onClick={(file, rank) => squareClicked(file, rank)}
//                     onDragStart={(file, rank) => dragStart(file, rank)}
//                 ></PieceGrid>

//             </div>
//         </DndProvider>
//     );

// }

// const rankEl = (rank: rank, boardState: BoardState, squareClicked: (file: file, rank: rank) => void, dragStart: (file: file, rank: rank) => void, setPieces: (pieces: LocatedPiece[]) => void) => {
//     return (
//         <div key={rank} className="rank">
//             {files.map(file => (
//                 <SquareEl 
//                     key={`square-${file}-${rank}`}
//                     square={boardState.getSquare(file, rank)}
//                     onSquareClick={(file, rank) => squareClicked(file, rank)}
//                     onDragStart={(file, rank) => dragStart(file, rank)}
//                     isActive={boardState.isActiveSq(file, rank)}
//                     isAvailable={boardState.isAvailableSquare(file, rank)}
//                     onDrop={() => setPieces(boardState.movePieceTo({file, rank}))}
//                 />
//             ))}
//         </div>
//     );
// }


// import { useEffect, useState } from 'react';
// import { BoardInternalState, boardState, BoardState, files, ranks } from './board-state';
// import './Board.css';
// import './PieceGrid.css';
// import { fenStringType, file, rank } from './types';
// import { DndProvider } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';
// import { SquareEl } from './SquareEl';
// import { CustomDragLayer } from './CustomDragLayer';
// import { Piece } from '../pieces/piece';
// import { PieceGrid } from './PieceGrid';
// import { useDispatch } from 'react-redux';
// import { setBoard } from '../app/pieceLocationSlice';
// import { Square } from './square';
// import { BISHOP, BLACK, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE } from '../pieces/pieces'
// import { getFileFrom, getRankFrom } from './utils';
// import { back, clearActiveSq, forward, getActiveSquare, getLocatedPieces, getSquare, hasActiveSq, initBoard, isActiveSq, isAvailableSquare, isOwnPiece, loadPositionFromFen, movePieceTo, setActiveSquare, START_FEN } from './board-utils';

// const board: file[][] = [
//     files,
//     files,
//     files,
//     files,
//     files,
//     files,
//     files,
//     files,
// ];

// type RankData = {
//     rank: rank;
//     boardState: BoardInternalState;
//     squareClicked: (file: file, rank: rank) => void;
//     dragStart: (file: file, rank: rank) => void;
// };

// export type LocatedPiece = {
//     file: file;
//     rank: rank;
//     piece: Piece;
// };

// export const Board = () => {

//     const state: BoardInternalState = loadPositionFromFen(START_FEN, initBoard());
//     const [boardState, setBoardState] = useState<BoardInternalState>(state);

//     // pieces need to be in a consistent order - not in the order they appear on the board
//     // same pieces in the same order each time so react knows not to rerender (actually in the dom) a piece just because it moves
//     const pieces = getLocatedPieces(boardState).sort((a: LocatedPiece, b: LocatedPiece) => a.piece.id.localeCompare(b.piece.id));

//     console.log('pieces:', pieces)
//     const mapLocatedPiecesToLocatedIDs = (lp: LocatedPiece) => ({file: lp.file, rank: lp.rank, id: lp.piece.id});

//     const historyListener = (e: KeyboardEvent) => {
//         if (e.key === 'ArrowRight') {
//             setBoardState(forward(boardState));
//         } else if (e.key === 'ArrowLeft') {
//             setBoardState(back(boardState));
//         }
//     };

//     useEffect(() => {
//         document.addEventListener('keydown', historyListener);

//         // clean up
//         return () => document.removeEventListener('keydown', historyListener);
//     }, []);

//     const dispatch = useDispatch();
//     useEffect(() => {
//         dispatch(setBoard(pieces.map(mapLocatedPiecesToLocatedIDs)));
//     }, [pieces]);

//     const squareClicked = (file: file, rank: rank) => {
//         console.log('square clicked');
//         // set active piece if they've clicked their own piece and it's their turn
//         if (isOwnPiece(file, rank, boardState) && !isActiveSq(file, rank, boardState)) {
//             setBoardState(setActiveSquare(file, rank, boardState));
//         }
//         // clear the active square if it's active and they've clicked it again
//         else if (hasActiveSq(boardState) && isActiveSq(file, rank, boardState)) {
//             setBoardState(clearActiveSq(boardState));
//         }
//         // move the piece if there's an active piece and they havn't clicked their own piece
//         if (hasActiveSq(boardState) && !isOwnPiece(file, rank, boardState)) {
//             setBoardState(movePieceTo({file, rank}, boardState));
//         }
//     };

//     const dragStart = (file: file, rank: rank) => {
//         // set active piece if they've clicked their own piece and it's their turn
//         if (isOwnPiece(file, rank, boardState) && !isActiveSq(file, rank, boardState)) {
//             setBoardState(setActiveSquare(file, rank, boardState));
//         }
//     };

//     // const onDrop = (file: file, rank: rank) => {
//     //     console.log('dropping from', getActiveSquare(boardState), 'to', {file, rank})
//     //     setBoardState(movePieceTo({file, rank}, boardState));
//     // };

//     return (
//         <DndProvider backend={HTML5Backend}>
//             <CustomDragLayer board={boardState}/>
//             <div className="board">

//                 {
//                     board.map((r, i) => {
//                         // return (
//                         //     <RankEl
//                         //         key={8 - i}
//                         //         rank={8 - i as rank}
//                         //         boardState={boardState}
//                         //         squareClicked={squareClicked}
//                         //         dragStart={dragStart}
//                         //         // onDrop={(file: file, rank: rank) => onDrop(file, rank)}
//                         //     ></RankEl>
//                         // );

//                         return (
//                             <div key={8 - i as rank} className="rank">
//                                 {files.map(file => (
//                                     <SquareEl 
//                                         key={`square-${file}-${8 - i as rank}`}
//                                         square={getSquare(file, 8 - i as rank, boardState)}
//                                         onSquareClick={(file, rank) => squareClicked(file, rank)}
//                                         onDragStart={(file, rank) => dragStart(file, rank)}
//                                         isActive={isActiveSq(file, 8 - i as rank, boardState)}
//                                         isAvailable={isAvailableSquare(file,8 - i as  rank, boardState)}
//                                         onDrop={(f: file, r: rank) => setBoardState(movePieceTo({file, rank: 8 - i as rank}, boardState))}
//                                     />
//                                 ))}
//                             </div>
//                         )
//                     })
//                 }

//                 {/* <PieceGrid
//                     locations={pieces}
//                     onClick={(file, rank) => squareClicked(file, rank)}
//                     onDragStart={(file, rank) => dragStart(file, rank)}
//                 ></PieceGrid> */}

//             </div>
//         </DndProvider>
//     );

// }

// const RankEl = ({ rank, boardState, squareClicked, dragStart }: RankData) => {
//     return (
//         <div key={rank} className="rank">
//             {files.map(file => (
//                 <SquareEl 
//                     key={`square-${file}-${rank}`}
//                     square={getSquare(file, rank, boardState)}
//                     onSquareClick={(file, rank) => squareClicked(file, rank)}
//                     onDragStart={(file, rank) => dragStart(file, rank)}
//                     isActive={isActiveSq(file, rank, boardState)}
//                     isAvailable={isAvailableSquare(file, rank, boardState)}
//                     onDrop={(f: file, r: rank) => setBoardState(movePieceTo({file, rank}, boardState))}
//                 />
//             ))}
//         </div>
//     );
// }

import { useEffect, useState } from 'react';
import { BoardInternalState, boardState, BoardState, files, ranks } from './board-state';
import './Board.css';
import './PieceGrid.css';
import { fenStringType, file, rank } from './types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SquareEl } from './SquareEl';
import { CustomDragLayer } from './CustomDragLayer';
import { Piece } from '../pieces/piece';
import { PieceGrid } from './PieceGrid';
import { useDispatch } from 'react-redux';
import { setBoard } from '../app/pieceLocationSlice';
import { Square } from './square';
import { BISHOP, BLACK, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE } from '../pieces/pieces'
import { getFileFrom, getRankFrom } from './utils';
import { back, clearActiveSq, forward, getActiveSquare, getLocatedPieces, getSquare, hasActiveSq, initBoard, isActiveSq, isAvailableSquare, isOwnPiece, loadPositionFromFen, movePieceTo, setActiveSquare, START_FEN } from './board-utils';

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

const squareClicked = (file: file, rank: rank, boardState: BoardInternalState, setBoardState: (state: BoardInternalState) => void) => {
    console.log('square clicked');
    // set active piece if they've clicked their own piece and it's their turn
    if (isOwnPiece(file, rank, boardState) && !isActiveSq(file, rank, boardState)) {
        setBoardState(setActiveSquare(file, rank, boardState));
    }
    // clear the active square if it's active and they've clicked it again
    else if (hasActiveSq(boardState) && isActiveSq(file, rank, boardState)) {
        setBoardState(clearActiveSq(boardState));
    }
    // move the piece if there's an active piece and they havn't clicked their own piece
    if (hasActiveSq(boardState) && !isOwnPiece(file, rank, boardState)) {
        setBoardState(movePieceTo({file, rank}, boardState));
    }
};

const dragStart = (file: file, rank: rank, boardState: BoardInternalState, setBoardState: (state: BoardInternalState) => void) => {
    // set active piece if they've clicked their own piece and it's their turn
    if (isOwnPiece(file, rank, boardState) && !isActiveSq(file, rank, boardState)) {
        setBoardState(setActiveSquare(file, rank, boardState));
    }
};

const onDrop = (file: file, rank: rank, boardState: BoardInternalState, setBoardState: (state: BoardInternalState) => void) => {
    console.log('dropping from', getActiveSquare(boardState), 'to', {file, rank})
    setBoardState(movePieceTo({file, rank}, boardState));
};

export const Board = ({state}: {state: BoardInternalState}) => {

    const [boardState, setBoardState] = useState<BoardInternalState>(state);

    return (
        <DndProvider backend={HTML5Backend}>
            <CustomDragLayer board={boardState}/>
            <div className="board">
                {
                    board.map((r, i) => {
                        return (
                            <div key={8 - i as rank} className="rank">
                                {files.map(file => (
                                    <SquareEl 
                                        key={`square-${file}-${8 - i as rank}`}
                                        square={getSquare(file, 8 - i as rank, boardState)}
                                        onSquareClick={(file, rank) => squareClicked(file, rank, boardState, setBoardState)}
                                        onDragStart={(file, rank) => dragStart(file, rank, boardState, setBoardState)}
                                        isActive={isActiveSq(file, 8 - i as rank, boardState)}
                                        isAvailable={isAvailableSquare(file, 8 - i as rank, boardState)}
                                        onDrop={(f: file, r: rank) => onDrop(file, 8 - i as rank, boardState, setBoardState)}
                                    />
                                ))}
                            </div>
                        )
                    })
                }

                {/* <PieceGrid
                    locations={pieces}
                    onClick={(file, rank) => squareClicked(file, rank)}
                    onDragStart={(file, rank) => dragStart(file, rank)}
                ></PieceGrid> */}

            </div>
        </DndProvider>
    );

}
