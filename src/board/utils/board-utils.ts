import {
    Piece, UnidentifiedPiece, BISHOP, COLOR_BLACK, COLOR_WHITE,
    getPiece as createPiece, KING, KNIGHT, PAWN, QUEEN, ROOK
} from './piece-utils';
import { getPieceMovement } from './board-navigator-utils';
import { isAttacked } from './board-scout-utils';
import { SquareState, getCoordinates, liftPiece, setPiece } from './square-utils';
import { coord, fenStringType, file, pieceColor, pieceType, rank } from '../types';

export const files: file[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const filesReversed: file[] = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
export const ranks: rank[] = [1, 2, 3, 4, 5, 6, 7, 8];
export const ranksReversed: rank[] = [8, 7, 6, 5, 4, 3, 2, 1];
export const START_FEN: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

export type BoardState = {
    squares: boardSquaresState;
    undoHistory: move[][];
    redoHistory: move[][];
    activeSq: SquareState | null;
    availableSquares: SquareState[];
    playersTurn: pieceColor;
    enPassantState: enPassantState | undefined;
    promotionState: coord | undefined;
};

export type LocatedPiece = {
    file: file;
    rank: rank;
    piece: Piece;
};

type boardSquaresState = {
    [file: string]: {
        [rank: number]: SquareState
    }
}

type capture = {
    piece: Piece;
    coord: coord
};

type move = {
    from: coord;
    to: coord;
    capture?: capture;

    /**
     * describes if this move is the promotion of a pawn (before we know what the player selected)
     * or the piece type the player chose to promote to
     */
    promotion?: boolean | pieceType;

    /**
     * optional callback used to reverse piece state: ie set hasMoved back to false
     */
    reverse?: () => void;
};

type enPassantState = {
    /**
     * square that the pawn to be captured moved to
     */
    pieceSquare: coord;

    /**
     * square that the pawn to be captured skipped, on it's first move
     */
    captureSquare: coord;
};

type SimulateMoveData<T> = {
    move: {
        from: coord,
        to: coord
    };
    callback: (state: BoardState) => T;
    state: BoardState;
};

export const getSquare: (file: file, rank: rank, state: BoardState) => SquareState = (file: file, rank: rank, state: BoardState) => {
    return state.squares[file][rank];
}

export const getActiveSquare: (state: BoardState) => SquareState | null = (state: BoardState) => {
    return state.activeSq;
}

export const setActiveSquare: (file: file, rank: rank, state: BoardState) => BoardState = (file: file, rank: rank, state: BoardState) => {
    state = {...state};
    state.activeSq = state.squares[file][rank];
    state.availableSquares = getPieceMovement(state, state.activeSq);
    return state;
}

export const clearActiveSq: (state: BoardState) => BoardState = (state: BoardState) => {
    state = {...state};
    state.activeSq = null;
    state = clearAvailableSquares(state);
    return state;
}

export const hasActiveSq = (state: BoardState) => {
    return !!state.activeSq;
}

export const isActiveSq = (file: file, rank: rank, state: BoardState) => {
    return !!state.activeSq && state.activeSq.file === file && state.activeSq.rank === rank;
}

export const isAvailableSquare = (file: file, rank: rank, state: BoardState) => {
    return !!state.availableSquares.find(sq => sq.file === file && sq.rank === rank);
}

export const isOwnPiece = (file: file, rank: rank, state: BoardState) => {
    return getSquare(file, rank, state).piece?.color === state.playersTurn;
}

export const getSquareByPieceID: (id: string, state: BoardState) => SquareState | undefined =  (id: string, state: BoardState) => {
    let square: SquareState | undefined;
    for (const file of files) {
        for (const rank of ranks) {
            const sq = state.squares[file][rank];
            if (sq.piece && sq.piece.id === id) {
                return sq;
            }
        }
    }
    return square;
}

export const isInCheck = (state: BoardState) => {
    const kingSq = getSquareWithPiece('king', state.playersTurn, state);
    return !!kingSq && isAttacked(state, getCoordinates(kingSq));
}

export const getPlayingColor: (state: BoardState) => pieceColor = (state: BoardState) => {
    return state.playersTurn;
}

export const getPlayingDirection: (state: BoardState) => 1 | -1 = (state: BoardState) => {
    return state.playersTurn === 'white' ? 1 : -1;
}

export const getEnPassantCaptureSq: (state: BoardState) => coord | false = (state: BoardState) => {
    return !!state.enPassantState && state.enPassantState.captureSquare;
}

export const getEnPassantPieceSq: (state: BoardState) => coord | false = (state: BoardState) => {
    return !!state.enPassantState && state.enPassantState.pieceSquare;
}

export const back: (state: BoardState) => BoardState = (state: BoardState) => {
    state = {...state};
    if (state.undoHistory.length > 0) {
        state = clearActiveSq(state);
        const movesToUndo = state.undoHistory.splice(-1, 1)[0];
        makeHistoryMovesBackwards(movesToUndo, state);
        state.redoHistory.push(movesToUndo);
        state = switchPlayer(state);
    }
    return state;
}

export const forward: (state: BoardState) => BoardState = (state: BoardState) => {
    state = {...state};
    if (state.redoHistory.length > 0) {
        state = clearActiveSq(state);
        const movesToRedo = state.redoHistory.splice(-1, 1)[0];
        makeHistoryMovesForwards(movesToRedo, state);
        state.undoHistory.push(movesToRedo);
        state = switchPlayer(state);
    }
    return state;
}

/**
 * Allows you to simulate a piece moving, providing the board state to the callback to run calculations,
 * then undos the move after the callback finishes
 * @param move - the move to simulate
 * @param callback - the callabck function in which to run calculations on the simulated board state
 * @returns - the return value of the callback
 */
 export const simulateMove: <T>({ move, callback, state }: SimulateMoveData<T>) => T = <T>({ move, callback, state }: SimulateMoveData<T>) => {
    // make move
    const capture = makeUnvalidatedMove(move.from, move.to, state);

    const returnValue = callback(state);

    // undo move
    makeHistoryMoveBackwards({
        from: move.from,
        to: move.to,
        capture: capture
    }, state);

    return returnValue;
}


/**
 * Moves the piece in the active square to the given square
 */
 export const movePieceTo: (to: coord, state: BoardState) => BoardState = (to: coord, state: BoardState) => {
    state = {...state};

    if (isValidMove(to.file, to.rank, state)) {

        // move piece to new square
        const moves = movePiece(to, state);

        if (moves.length > 0) {

            state.undoHistory.push(moves);
            state.redoHistory = [];

            // only switch player if a piece was moved and we're not waiting on selecting a promotion
            if (!moves.find(m => m.promotion)) {
                state = switchPlayer(state);
            }
        }

        state = clearActiveSq(state);
        state = clearAvailableSquares(state);
    }

    return state;
}

export const promotePiece = ({ file, rank }: coord, type: pieceType, state: BoardState) => {
    state = {...state};

    changePiece({file, rank}, type, state);
    state = switchPlayer(state); // TODO: you need to lock normal player moves while a piece needs to be selected
    state.promotionState = undefined;

    return state;
}

export const getLocatedPieces: (state: BoardState) => LocatedPiece[] = (state: BoardState) => {
    const locatedPieces: LocatedPiece[] = [];
    for (const file of files) {
        for (const rank of ranks) {
            const sq = state.squares[file] && state.squares[file][rank];
            if (sq && sq.piece) {
                locatedPieces.push({
                    file: file,
                    rank: rank,
                    piece: sq.piece
                });
            }
        }
    }
    return locatedPieces;
}

export const initBoard: () => BoardState = () => {
    return {
        squares: initSquares(),
        activeSq: null,
        availableSquares: [],
        enPassantState: undefined,
        playersTurn: 'white',
        redoHistory: [],
        undoHistory: [],
        promotionState: undefined
    };
}

export const loadPositionFromFen: (fen: string, state: BoardState) => BoardState = (fen: string, state: BoardState) => {
    state = {...state};
    state.squares = initSquares(); // clear state

    const symbolMap = {
        k: KING,
        p: PAWN,
        n: KNIGHT,
        b: BISHOP,
        r: ROOK,
        q: QUEEN
    };

    let file: file = 'a', rank: rank = 8;

    const unidentifiedPieces = [];

    for (const symbol of fen) {
        if (symbol === '/') {
            file = 'a';
            rank = getRankFrom(rank, -1);
        } else {
            if (isNaN(Number(symbol))) {
                const type = symbolMap[symbol.toLowerCase() as fenStringType];
                unidentifiedPieces.push({
                    file,
                    rank,
                    piece: createPiece(symbol === symbol.toUpperCase() ? COLOR_WHITE : COLOR_BLACK, type)
                });
                file = getFileFrom(file, 1);
            } else {
                file = getFileFrom(file, Number(symbol));
            }
        }
    }

    unidentifiedPieces.forEach((up, index) => addPiece({...up.piece, id: index.toString()}, up.file, up.rank, state));

    return state;
}

/**
 * Gets the coordinate { file, rank } of the square [fileCount] and [rankCount] away from the given square
 */
export const getSquareFrom = (fromFile: file, fileCount: number, fromRank: rank, rankCount: number): coord | undefined => {
    const file = getFileFrom(fromFile, fileCount);
    const rank = getRankFrom(fromRank, rankCount);
    if (file && rank) {
        return { file, rank };
    }
 }

/**
 * Gets the file that is [count] many files from the file provided
 * @param file 
 * @param count 
 * @returns 
 */
export const getFileFrom = (file: file, count: number): file => {
    const fileIndex = files.indexOf(file);
    return files[fileIndex + count];
}

export const switchPlayer: (state: BoardState) => BoardState = (state: BoardState) => {
    state = {...state};
    state.playersTurn = state.playersTurn === 'white' ? 'black' : 'white';
    return state;
}

/**
 * describes if the board is in a state where it is ready for the piece on the active square to be moved
 */
export const isValidMove = (file: file, rank: rank, state: BoardState) => {
    return !!state.activeSq &&
        !isActiveSq(file, rank, state) &&
        isAvailableSquare(file, rank, state) &&
        !isOwnPiece(file, rank, state);
}

/**
 * describes if the board is in a state where a player can select an active square
 */
export const readyForActiveSquareSelection = (file: file, rank: rank, state: BoardState) => {
    return isOwnPiece(file, rank, state) &&
        !isActiveSq(file, rank, state) &&
        !state.promotionState;
}

/**
 * gets the files and ranks to render the board, based on who's turn it is and if the board should be flipped for black
 * 
 * with a board perspective of playing with white's pieces:
 *     files are rendered: a -> h (left to right)
 *     ranks are rendered: 8 -> 1 (top to bottom)
 * 
 * with a board perspective of playing with blacks's pieces:
 *     files are rendered: h -> a (left to right)
 *     ranks are rendered: 1 -> 8 (top to bottom)
 * 
 */
export const getBoardRenderOrder: (playersTurn: pieceColor, flippedBoard?: boolean) => [file[], rank[]] = (playersTurn, flippedBoard = false) => {
    return playersTurn === 'black' && flippedBoard ? [filesReversed, ranks] : [files, ranksReversed];
}

/**
 * Gets the rank that is [count] many ranks from the rank provided
 * @param rank 
 * @param count 
 * @returns 
 */
const getRankFrom = (rank: rank, count: number): rank => {
    const rankIndex = ranks.indexOf(rank);
    return ranks[rankIndex + count];
}

const clearAvailableSquares = (state: BoardState) => {
    state = {...state};
    state.availableSquares = [];
    return state;
}

const getSquareWithPiece: (type: pieceType, color: pieceColor, state: BoardState) => SquareState | undefined = (type: pieceType, color: pieceColor, state: BoardState) => {
    let square: SquareState | undefined;
    for (const file of files) {
        for (const rank of ranks) {
            const sq = state.squares[file][rank];
            if (sq.piece && sq.piece.type === type && sq.piece.color === color) {
                square = sq;
            }
        }
    }
    return square;
}

/**
 * Sets piece on given square 
 */
const setPieceOn: (piece: Piece | undefined, square: SquareState) => void = (piece: Piece | undefined, square: SquareState) => {
    if (piece) {
        setPiece(piece, square);
    }
}

/**
 * Utility for changing a piece eg: when promoting a pawn
 */
const changePiece: (coord: coord, newType: pieceType, state: BoardState) => Piece | undefined = ({file, rank}: coord, newType: pieceType, state: BoardState) => {
    const oldPiece = liftSquarePiece({file, rank}, state);
    let newPiece: Piece | undefined;
    if (oldPiece) {
        const promotedPiece: UnidentifiedPiece = createPiece(oldPiece?.color, newType);
        newPiece = {...promotedPiece, id: oldPiece.id};
        addPiece(newPiece, file, rank, state);
    }
    return newPiece;
}

/**
 * moves a piece to -> from without checking if it is legal etc
 */
const makeHistoryMoveBackwards: (move: move, state: BoardState) => void = (move: move, state: BoardState) => {
    // destructure here because we may need to update the pieceType on move.promotion
    const {from, to, capture, promotion, reverse} = move;
    const fromSq = getSquare(to.file, to.rank, state);
    const pieceToMove = liftSquarePiece(fromSq, state);
    const toSq = getSquare(from.file, from.rank, state);

    setPieceOn(pieceToMove, toSq);

    // undo the capture
    if (capture) {
        setPieceOn(capture.piece, getSquare(capture.coord.file, capture.coord.rank, state));
    }

    if (promotion) {
        // store the state of what the promotion was for redo moves
        move.promotion = pieceToMove?.type;
        // when going back, we always go back to a pawn
        changePiece({file: toSq.file, rank: toSq.rank}, 'pawn', state);
    }

    // run the reverse callback if there is one
    if (reverse) {
        reverse(); // TODO: cant store a function in the move
    }
}

const makeHistoryMovesBackwards: (moves: move[], state: BoardState) => void = (moves: move[], state: BoardState) => {
    moves.forEach(move => makeHistoryMoveBackwards(move, state));
}

/**
 * moves a piece from -> to without checking if it is legal etc
 * @param capture - a capture to make, if one was made on a sqaure other than the 'to' sqaure
 *      (usually for en passant captures when going forwards in history)
 */
const makeHistoryMoveForwards: (move: move, state: BoardState) => void = ({from, to, capture, promotion}: move, state: BoardState) => {

    const fromSq = getSquare(from.file, from.rank, state);
    let pieceToMove = liftSquarePiece(fromSq, state);
    const toSq = getSquare(to.file, to.rank, state);

    // capture the piece before you set the taking piece down
    if (capture) {
        const capturedSq = getSquare(capture.coord.file, capture.coord.rank, state);
        liftSquarePiece(capturedSq, state);

        // TODO: put this into players stash of taken pieces
    }
    
    setPieceOn(pieceToMove, toSq);

    if (promotion) {
        pieceToMove = changePiece({file: toSq.file, rank: toSq.rank}, promotion as pieceType, state);
    }
}

const makeHistoryMovesForwards: (moves: move[], state: BoardState) => void = (moves: move[], state: BoardState) => {
    moves.forEach(move => makeHistoryMoveForwards(move, state));
}

/**
 * moves a piece from -> to without checking if it is legal etc
 * @returns a capture, if one was made
 */
const makeUnvalidatedMove: (from: coord, to: coord, state: BoardState) => capture | undefined = (from: coord, to: coord, state: BoardState) => {
    let capture: capture | undefined;

    const fromSq = getSquare(from.file, from.rank, state);
    const pieceToMove = liftSquarePiece(fromSq, state);

    // set the piece on the sqare that the piece came from
    const toSq = getSquare(to.file, to.rank, state);

    // get the piece to take before you set the taking piece down
    if (toSq.piece) {
        capture = {
            piece: toSq.piece,
            coord: getCoordinates(toSq)
        };
    }

    setPieceOn(pieceToMove, toSq);

    return capture;
}

/**
 * true if same color, false if not, false if either square has no piece
 */
const compareSquarePieceColor: (sq1: SquareState, sq2: SquareState) => boolean = (sq1: SquareState, sq2: SquareState) => {
    return !!sq1.piece && !!sq2.piece && sq1.piece.color === sq2.piece.color;
}

/**
 * gets any en passant state if a pawn has been moved 2 squares
 */
const getEnPassantState: (fromSq: coord, toSq: coord, pieceToMove: Piece, state: BoardState) => enPassantState | undefined = (fromSq: coord, toSq: coord, pieceToMove: Piece, state: BoardState) => {
    // if the piece is a pawn and has moved 2 squares
    if (pieceToMove.type === 'pawn' && Math.abs(fromSq.rank - toSq.rank) === 2) {
        // get square to be marked
        return {
            captureSquare: { // capture square is where the pawn can be captured
                file: fromSq.file,
                rank: (fromSq.rank + toSq.rank) / 2 as rank // average of the 'from' and 'to' ranks will be the middle rank
            },
            pieceSquare: { // piece square is where the piece was moved to
                file: toSq.file,
                rank: toSq.rank
            }
        };
    }
}

/**
 * true if coords are the same, false if not or if either param is falsey
 */
const compareSquareCoords = (sq1: coord, sq2: coord) => {
    return !!sq1 && !!sq2 && sq1.file === sq2.file && sq1.rank === sq2.rank;
}

/**
 * Captures piece on given square
 */
const capturePiece: (square: SquareState, state: BoardState) => capture | undefined = (square: SquareState, state: BoardState) => {

    // lift piece to be taken
    const capturedPiece = liftSquarePiece(square, state);

    // add captured piece to current players stash
    // TODO

    if (capturedPiece) {
        return {
            piece: capturedPiece,
            coord: getCoordinates(square)
        };
    }
}

/**
 * Captures piece as defined by the en passant state
 */
const capturePieceByEnPassant: (state: BoardState) => capture | undefined = (state: BoardState) => {
    if (state.enPassantState?.pieceSquare) {

        // lift piece to be taken
        const sq = getSquare(state.enPassantState.pieceSquare.file, state.enPassantState.pieceSquare.rank, state);
        const capturedPice = liftSquarePiece(sq, state);

        if (capturedPice) {

            // add captured piece to current players stash
            // TODO

            return {
                piece: capturedPice,
                coord: getCoordinates(sq)
            };
        }

    }
}

/**
 * @returns a list of moves that were made
 * 
 * TODO: should a capture just be a move from the square -> to OFF the board and into the players stash?
 * 
 */
const movePiece: (to: coord, state: BoardState) => move[] = (to: coord, state: BoardState) => {
    let pieceToMove: Piece | undefined;
    const moves: move[] = [];
    const fromSq = state.activeSq;
    const toSq = state.squares[to.file][to.rank];
    const promotion: boolean = (toSq.rank === 8 || toSq.rank === 1) && !!(fromSq && fromSq.piece && fromSq.piece.type === PAWN);

    // capturing a piece
    if (fromSq && fromSq.piece && toSq && toSq.piece && !compareSquarePieceColor(fromSq, toSq)) {
        const capture = capturePiece(toSq, state); // capture the piece before you set down the taking piece
        pieceToMove = liftSquarePiece(fromSq, state);
        setPieceOn(pieceToMove, toSq);

        moves.push({
            from: getCoordinates(fromSq),
            to: getCoordinates(toSq),
            capture,
            promotion
        });
    }
    // capturing by en passant
    else if (
        fromSq && toSq && state.enPassantState?.captureSquare &&
        compareSquareCoords(toSq, state.enPassantState.captureSquare) &&
        !compareSquarePieceColor(fromSq, getSquare(state.enPassantState.pieceSquare.file, state.enPassantState.pieceSquare.rank, state))
    ) {
        const capture = capturePieceByEnPassant(state); // capture the piece before you set down the taking piece
        pieceToMove = liftSquarePiece(fromSq, state);
        setPieceOn(pieceToMove, toSq);

        moves.push({
            from: getCoordinates(fromSq),
            to: getCoordinates(toSq),
            capture
        });
    }
    // moving to an empty square
    else if (fromSq && fromSq.piece && !toSq.piece) {

        moves.push({
            from: getCoordinates(fromSq),
            to: getCoordinates(toSq),
            capture: undefined,
            promotion
        });

        // castling - if moving a king more than 1 space
        if (fromSq.piece.type === 'king' && distanceBetweenFiles(fromSq.file, toSq.file) > 1) {

            // move rook to other side of king
            if (fromSq.file < toSq.file) {
                // short castling
                const rookSq = getSquare('h', fromSq.rank, state);
                if (rookSq.piece) {
                    const rook = liftSquarePiece(rookSq, state);
                    setPieceOn(rook, getSquare('f', fromSq.rank, state));

                    moves.push({
                        from: {file: 'h', rank: fromSq.rank},
                        to: {file: 'f', rank: fromSq.rank}
                    });
                }
            } else {
                // long castling
                const rookSq = getSquare('a', fromSq.rank, state);
                if (rookSq.piece) {
                    const rook = liftSquarePiece(rookSq, state);
                    setPieceOn(rook, getSquare('d', fromSq.rank, state));

                    moves.push({
                        from: {file: 'a', rank: fromSq.rank},
                        to: {file: 'd', rank: fromSq.rank}
                    });
                }
            }
        }

        // move piece (including castling king)
        pieceToMove = liftSquarePiece(fromSq, state);
        setPieceOn(pieceToMove, toSq);

    }

    // If a move was made
    if (fromSq && pieceToMove && moves.length > 0) {
        // TODO: need a new way to reverse the hasMoved flag.
        //       maybe store in a new property of the move state: {firstMove: boolean}
        if (!pieceToMove.hasMoved) {
            // set the has moved flag on the piece
            pieceToMove.hasMoved = true;
            // add a cleanup callback for reversing the state of the piece
            moves[0].reverse = () => (pieceToMove as Piece).hasMoved = false
        }

        // clear and set new en passant state
        state.enPassantState = getEnPassantState(fromSq, toSq, pieceToMove, state);

        // clear and set new promotion state
        state.promotionState = promotion ? getCoordinates(toSq) : undefined;
    }

    return moves;
}

const liftSquarePiece: (coord: coord, board: BoardState) => Piece | undefined = ({file, rank}: coord, board: BoardState) => {
    return liftPiece(getSquare(file, rank, board));
}

const initSquares: () => boardSquaresState = () => {
    const state: boardSquaresState = {};
    files.forEach(file => {
        ranks.forEach(rank => {
            if (!state[file]) {
                state[file] = {
                    [rank]: {
                        file,
                        rank,
                        available: false,
                        piece: null
                    }
                };
            } else if (!state[file][rank]) {
                state[file][rank] = {
                    file,
                    rank,
                    available: false,
                    piece: null
                };
            }
        })
    });
    return state;
}

/**
 * Helper method for adding new pieces to the board
 */
 const addPiece = (piece: Piece, file: file, rank: rank, state: BoardState) => {
    const square = state.squares[file][rank];
    if (square) {
        setPiece(piece, square);
    }
}

/**
 * Gets the distance between two files
 * @param from 
 * @param to 
 * @returns 
 */
const distanceBetweenFiles = (from: file, to: file) => Math.abs(files.indexOf(from) - files.indexOf(to));
