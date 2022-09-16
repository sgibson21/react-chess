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
export const START_FEN: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq';

export type BoardState = {
    squares: boardSquaresState;
    undoHistory: move[][];
    redoHistory: move[][];
    activeSq: SquareState | null;
    availableSquares: SquareState[];
    playersTurn: pieceColor;
    castling: string;
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

type castlingSymbol = 'K' | 'Q' | 'k' | 'q';

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
     * 
     * TODO: Now that we're trying to represent the full state using a fen string,
     * we can implement history with fen strings and do away with a reverse function
     *   
     */
    reverse?: (board: BoardState) => BoardState;
};

type enPassantState = {
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

export const isCheckmate: (state: BoardState) => boolean = (state: BoardState) => {
    if (isInCheck(state)) {
        // check all current players pieces to see if any moves are available
        const squares: SquareState[] = [];
            // get all squares with correct coloured pieces
            files.forEach(file => {
                ranks.forEach(rank => {
                    const square = state.squares[file][rank];
                    if (square && square.piece && square.piece.color === state.playersTurn) {
                        squares.push(square);
                    }
                });
            });

            // getPieceMovement of each square
            const squareWithValidMove = squares.find(sq => getPieceMovement(state, sq).length > 0)

            // return true if no moves found
            return !squareWithValidMove;
    }

    return false;
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

export const getEnPassantPieceCoord: (state: BoardState) => coord | false = (state: BoardState) => {
    if (state.enPassantState?.captureSquare) {
        return getSquareFrom(
            state.enPassantState.captureSquare.file, 
            0,
            state.enPassantState.captureSquare.rank,
            getPlayingDirection(state) * -1 // reverse the direction: if it's white's turn then look further down the board
        ) || false;
    }

    return false;
}

export const back: (state: BoardState) => BoardState = (state: BoardState) => {
    state = {...state};
    // dont allow history during promotion selection
    if (state.undoHistory.length > 0 && !state.promotionState) {
        state = clearActiveSq(state);
        const movesToUndo = getMovesToUndo(state);
        state = makeHistoryMovesBackwards(movesToUndo, state);
        state.redoHistory.push(movesToUndo);
        state = switchPlayer(state);
    }
    return state;
}

export const forward: (state: BoardState) => BoardState = (state: BoardState) => {
    state = {...state};
    // dont allow history during promotion selection
    if (state.redoHistory.length > 0 && !state.promotionState) {
        state = clearActiveSq(state);
        const movesToRedo = getMovesToRedo(state);
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

    // undo move - returned state not used
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
        const [moves, castlingAvailability] = movePiece(to, state);

        state.castling = castlingAvailability;

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

export const cancelPromotion = (state: BoardState) => {
    state = {...state};

    // clear the promotionState so the player can activate another piece
    state.promotionState = undefined;

    // go back without switching player or adding the undone move to the redo list
    state = clearActiveSq(state);
    const movesToUndo = getMovesToUndo(state);
    state = makeHistoryMovesBackwards(movesToUndo, state);

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
        castling: 'KQkq',
        redoHistory: [],
        undoHistory: [],
        promotionState: undefined
    };
}

/**
 * A FEN record contains six fields, each separated by a space. The fields are as follows:
 *
 * Piece placement data: Each rank is described, starting with rank 8 and ending with rank 1, with a "/" between each one;
 * within each rank, the contents of the squares are described in order from the a-file to the h-file.
 * Each piece is identified by a single letter taken from the standard English names in algebraic notation
 * (pawn = "P", knight = "N", bishop = "B", rook = "R", queen = "Q" and king = "K").
 * White pieces are designated using uppercase letters ("PNBRQK"), while black pieces use lowercase letters ("pnbrqk").
 * A set of one or more consecutive empty squares within a rank is denoted by a digit from "1" to "8",
 * corresponding to the number of squares.
 *
 * Active color: "w" means that White is to move; "b" means that Black is to move.
 *
 * Castling availability: If neither side has the ability to castle, this field uses the character "-".
 * Otherwise, this field contains one or more letters: "K" if White can castle kingside, "Q" if White can castle queenside,
 * "k" if Black can castle kingside, and "q" if Black can castle queenside. A situation that temporarily prevents castling
 * does not prevent the use of this notation.
 *
 * En passant target square: This is a square over which a pawn has just passed while moving two squares;
 * it is given in algebraic notation. If there is no en passant target square, this field uses the character "-".
 * This is recorded regardless of whether there is a pawn in position to capture en passant.
 * An updated version of the spec has since made it so the target square is only recorded if a legal en passant move
 * is possible but the old version of the standard is the one most commonly used.
 *
 * Halfmove clock: The number of halfmoves since the last capture or pawn advance, used for the fifty-move rule.
 *
 * Fullmove number: The number of the full moves. It starts at 1 and is incremented after Black's move.
 *
 */
export const loadPositionFromFen: (fen: string, state: BoardState) => BoardState = (fen: string, state: BoardState) => {
    state = {...state};
    state.squares = initSquares(); // clear state

    const [piecesFen, activeColor, castling, enPassant, halfmoveClock, fullmoveNumber] = fen.split(' ');

    state = loadFenPieces(piecesFen, state);

    state.playersTurn = activeColor === 'w' ? 'white' : 'black';

    state.castling = castling;

    return state;
}

/**
 * @returns [kingSide: boolean, queenSide: boolean]
 */
export const isCastlingAvailable: (pieceColor: pieceColor | undefined, board: BoardState) => [boolean, boolean] = (pieceColor: pieceColor | undefined, board: BoardState) => {
    if (board && board.castling && pieceColor === 'white') {
        return [board.castling.includes('K'), board.castling.includes('Q')];
    } else if (board && board.castling && pieceColor === 'black') {
        return [board.castling.includes('k'), board.castling.includes('q')];
    } else {
        return [false, false];
    }
}

/**
 * "K" - White can castle kingside
 * "Q" - White can castle queenside
 * "k" - Black can castle kingside
 * "q" - Black can castle queenside
 *
 * If neither side has the ability to castle, the castlingAvailability field uses the character "-".
 */
const revokeCastlingRights: (castlingAvailability: string, symbols: castlingSymbol[]) => string = (castlingAvailability: string, symbols: castlingSymbol[]) => {
    if (castlingAvailability && symbols && symbols.length > 0) {
        symbols.forEach(symbol => castlingAvailability = castlingAvailability.replace(symbol, ''));
    }

    if (castlingAvailability.length === 0) {
        castlingAvailability = '-';
    }

    return castlingAvailability;
}

const reinstateCastlingRights: (castlingAvailability: string, symbols: castlingSymbol[]) => string = (castlingAvailability: string, symbols: castlingSymbol[]) => {
    // remove dash if necessary
    if (symbols && symbols.length > 0 && castlingAvailability === '-') {
        castlingAvailability = '';
    }
    
    if (symbols && symbols.length > 0) {
        castlingAvailability = castlingAvailability.concat(...symbols);
    }

    return castlingAvailability;
}

const loadFenPieces: (piecesFen: string, state: BoardState) => BoardState = (piecesFen: string, state: BoardState) => {
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

    for (const symbol of piecesFen) {
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
export const readyForActiveSquareSelection = (file: file, rank: rank, state: BoardState, side?: pieceColor) => {
    return (!side || state.playersTurn === side) &&
        isOwnPiece(file, rank, state) &&
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
export const getBoardRenderOrder: (playersTurn: pieceColor, allowFlip?: boolean, side?: pieceColor) => [file[], rank[]] = (playersTurn, allowFlip = false, side) => {
    const whiteFacingOrder: [file[], rank[]] = [files, ranksReversed];
    const blackFacingOrder: [file[], rank[]]  = [filesReversed, ranks];
    return (playersTurn === 'black' && allowFlip) || side === 'black' ? blackFacingOrder : whiteFacingOrder;
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

const getMovesToUndo = (state: BoardState) => {
    return state.undoHistory.splice(-1, 1)[0];
}

const getMovesToRedo = (state: BoardState) => {
    return state.redoHistory.splice(-1, 1)[0];
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
const makeHistoryMoveBackwards: (move: move, state: BoardState) => BoardState = (move: move, state: BoardState) => {
    state = {...state};
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
        state = reverse(state);
    }

    return state;
}

const makeHistoryMovesBackwards: (moves: move[], state: BoardState) => BoardState = (moves: move[], state: BoardState) => {
    state = {...state};
    moves.forEach(move => state = makeHistoryMoveBackwards(move, state));
    return state;
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
const getEnPassantState: (fromSq: coord, toSq: coord, pieceToMove: Piece) => enPassantState | undefined = (fromSq: coord, toSq: coord, pieceToMove: Piece) => {
    // if the piece is a pawn and has moved 2 squares
    if (pieceToMove.type === 'pawn' && Math.abs(fromSq.rank - toSq.rank) === 2) {
        // get square to be marked
        return {
            captureSquare: { // capture square is where the pawn can be captured
                file: fromSq.file,
                rank: (fromSq.rank + toSq.rank) / 2 as rank // average of the 'from' and 'to' ranks will be the middle rank
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
 * @returns a list of moves that were made and the new castling availability
 * 
 * TODO: should a capture just be a move from the square -> to OFF the board and into the players stash?
 * 
 */
const movePiece: (to: coord, state: BoardState) => [move[], string] = (to: coord, state: BoardState) => {
    let pieceToMove: Piece | undefined;
    const moves: move[] = [];
    let castlingAvailability = state.castling;
    const fromSq = state.activeSq;
    const toSq = state.squares[to.file][to.rank];
    const promotion: boolean = (toSq.rank === 8 || toSq.rank === 1) && !!(fromSq && fromSq.piece && fromSq.piece.type === PAWN);
    const enPassantPieceCoord: coord | false = getEnPassantPieceCoord(state);

    if (!fromSq) {
        return [moves, castlingAvailability];
    }

    // captureSquare is optionally different from the toSq (eg for en passant)
    const makeCaptureMove = (captureSquare: SquareState = toSq) => {
        const capture = capturePiece(captureSquare, state); // capture the piece before you set down the taking piece
        pieceToMove = liftSquarePiece(fromSq, state);
        setPieceOn(pieceToMove, toSq);

        moves.push({
            from: getCoordinates(fromSq),
            to: getCoordinates(toSq),
            capture,
            promotion
        });
    }

    // capturing a piece
    if (fromSq.piece && toSq && toSq.piece && !compareSquarePieceColor(fromSq, toSq)) {
        makeCaptureMove();
    }
    // capturing by en passant
    else if (
        toSq && state.enPassantState?.captureSquare && enPassantPieceCoord &&
        compareSquareCoords(toSq, state.enPassantState.captureSquare) &&
        !compareSquarePieceColor(fromSq, getSquare(enPassantPieceCoord.file, enPassantPieceCoord.rank, state))
    ) {
        makeCaptureMove(
            getSquare(enPassantPieceCoord.file, enPassantPieceCoord.rank, state)
        );
    }
    // moving to an empty square
    else if (fromSq.piece && !toSq.piece) {

        moves.push({
            from: getCoordinates(fromSq),
            to: getCoordinates(toSq),
            capture: undefined,
            promotion
        });

        // castling - if moving a king more than 1 space
        if (fromSq.piece.type === 'king' && distanceBetweenFiles(fromSq.file, toSq.file) > 1) {

            const documentCastlingState = (move: move, symbolToRevoke: castlingSymbol) => {
                if (castlingAvailability.includes(symbolToRevoke)) {
                    castlingAvailability = revokeCastlingRights(castlingAvailability, [symbolToRevoke]);
                    // add reverse function to reinstate castling availability to the move
                    move.reverse = (state: BoardState) => {
                        state.castling = reinstateCastlingRights(castlingAvailability, [symbolToRevoke]);
                        return state;
                    };
                }
                return move;
            }

            // move rook to other side of king
            if (fromSq.file < toSq.file) {
                // short castling
                const rookSq = getSquare('h', fromSq.rank, state);
                if (rookSq.piece) {
                    const rook = liftSquarePiece(rookSq, state);
                    setPieceOn(rook, getSquare('f', fromSq.rank, state));

                    let move: move = {
                        from: {file: 'h', rank: fromSq.rank},
                        to: {file: 'f', rank: fromSq.rank}
                    };

                    const symbolToRevoke: castlingSymbol = fromSq.piece.color === 'white' ? 'K' : 'k';
                    move = documentCastlingState(move, symbolToRevoke);

                    moves.push(move);
                }
            } else {
                // long castling
                const rookSq = getSquare('a', fromSq.rank, state);
                if (rookSq.piece) {
                    const rook = liftSquarePiece(rookSq, state);
                    setPieceOn(rook, getSquare('d', fromSq.rank, state));

                    let move: move = {
                        from: {file: 'a', rank: fromSq.rank},
                        to: {file: 'd', rank: fromSq.rank}
                    };

                    const symbolToRevoke: castlingSymbol = fromSq.piece.color === 'white' ? 'Q' : 'q';
                    move = documentCastlingState(move, symbolToRevoke);
                    
                    moves.push(move);
                }
            }
        }

        // move piece (including castling king)
        pieceToMove = liftSquarePiece(fromSq, state);
        setPieceOn(pieceToMove, toSq);

    }

    // If a move was made
    if (pieceToMove && moves.length > 0) {
        // clear and set new en passant state
        state.enPassantState = getEnPassantState(fromSq, toSq, pieceToMove);

        // clear and set new promotion state
        state.promotionState = promotion ? getCoordinates(toSq) : undefined;
    }

    return [moves, castlingAvailability];
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
