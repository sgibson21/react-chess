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
export const START_FEN: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';

export type BoardState = {
    squares: boardSquaresState;
    undoHistory: move[][];
    redoHistory: move[][];
    activeSq: SquareState | null;
    availableSquares: SquareState[];
    playersTurn: pieceColor;
    castling: string;
    /**
     * square that the pawn to be captured skipped, on it's first move
     */
    enPassantCoord: coord | undefined;
    /**
     * this is the move that is created when a pawn moves to the last rank
     * we use this to undo this move if the player cancels thier promotion intent
     * this should be present only while the user is deciding which piece to promote to
     */
    promotionIntent?: move;
};

export type LocatedPiece = {
    file: file;
    rank: rank;
    piece: Piece;
};

export type move = {
    from: coord;
    to: coord;
    capture?: capture;
    /**
     * Describes the piece type the player selected upon completing promotion
     */
    promotionPiece?: pieceType;
    /**
     * describes the change in castling availability during this move
     */
    castling?: {
        from?: string,
        to?: string
    };
    /**
     * describes the change in the en passant target square during this move
     */
    enPassant?: {
        from?: coord,
        to?: coord
    };
};

type boardSquaresState = {
    [file: string]: {
        [rank: number]: SquareState
    }
};

type castlingSymbol = 'K' | 'Q' | 'k' | 'q';

export type capture = {
    piece: Piece;
    coord: coord
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
    return !!state.enPassantCoord && state.enPassantCoord;
}

export const getEnPassantPieceCoord: (state: BoardState) => coord | false = (state: BoardState) => {
    if (state.enPassantCoord) {
        return getSquareFrom(
            state.enPassantCoord.file, 
            0,
            state.enPassantCoord.rank,
            getPlayingDirection(state) * -1 // reverse the direction: if it's white's turn then look further down the board
        ) || false;
    }

    return false;
}

export const back: (state: BoardState) => BoardState = (state: BoardState) => {
    state = {...state};
    // dont allow history during promotion selection
    if (state.undoHistory.length > 0 && !state.promotionIntent) {
        state = clearActiveSq(state);
        const movesToUndo = getMovesToUndo(state);
        state = executeMovesBackwards(movesToUndo, state);
        state.redoHistory.push(movesToUndo);
        state = switchPlayer(state);
    }
    return state;
}

export const forward: (state: BoardState) => BoardState = (state: BoardState) => {
    state = {...state};
    // dont allow history during promotion selection
    if (state.redoHistory.length > 0 && !state.promotionIntent) {
        state = clearActiveSq(state);
        const movesToRedo = getMovesToRedo(state);
        executeHistoryMoves(movesToRedo, state);
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
    executeMoveBackwards({
        from: move.from,
        to: move.to,
        capture: capture
    }, state);

    return returnValue;
}

/**
 * Cancels the promotion of a pawn that is currently on @param from but has not yet been promoted
 */
 export const cancelPromotion: (from: coord, state: BoardState) => BoardState = (from: coord, state: BoardState) => {
    state = clearActiveSq(state);
    if (state.promotionIntent) {
        state = executeMoveBackwards(state.promotionIntent, state);
        state.promotionIntent = undefined;
    }
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
        enPassantCoord: undefined,
        playersTurn: 'white',
        castling: 'KQkq',
        redoHistory: [],
        undoHistory: []
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

    if (enPassant !== '-') {
        const [file, rank] = enPassant.split('');
        state.enPassantCoord = {file: file as file, rank: +rank as rank};
    }

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

const coordToString = (coord: coord | undefined) => {
    if (coord) {
        const { file, rank } = coord;
        return `${file}${rank}`;
    }
}

const createFen = (state: BoardState) => {
    const enPassant = coordToString(state.enPassantCoord) || '-';
    return `${createPieceFen(state)} ${state.playersTurn == 'white' ? 'w' : 'b'} ${state.castling} ${enPassant}`;
}

const createPieceFen = (state: BoardState) => {
    let FEN: string = '';
    if (state.squares) {
        // FEN begins at a8
        ranksReversed.forEach(rank => {
            let emptyCount: number = 0;

            files.forEach(file => {
                if (state.squares[file] && state.squares[file][rank]) {
                    const square = state.squares[file][rank];
                    if (square && square.piece) {

                        if (emptyCount > 0) {
                            FEN += `${emptyCount}`;
                        }

                        const symbol = getFenPieceSymbol(square.piece);
                        if (symbol) {
                            FEN += `${symbol}`;
                            emptyCount = 0;
                        }
                    } else {
                        emptyCount++;
                    }
                }
            });

            if (rank !== 1) {
                FEN += '/';
            }
        });
    }
    return FEN;
}

const getFenPieceSymbol = (piece: Piece) => {
    const symbolMap = {
        [KING]:   'k',
        [PAWN]:   'p',
        [KNIGHT]: 'n',
        [BISHOP]: 'b',
        [ROOK]:   'r',
        [QUEEN]:  'q'
    };

    const symbol = symbolMap[piece.type];

    if (symbol) {
        return piece.color === 'white' ? symbol.toUpperCase() : symbol;
    }
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
        !state.promotionIntent;
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

export const getMovesToUndo = (state: BoardState) => {
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
export const changePiece: (coord: coord, newType: pieceType, state: BoardState) => Piece | undefined = ({file, rank}: coord, newType: pieceType, state: BoardState) => {
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
export const executeMoveBackwards: (move: move, state: BoardState) => BoardState = (move: move, state: BoardState) => {
    state = {...state};
    // destructure here because we may need to update the pieceType on move.promotionPiece
    const {from, to, capture, enPassant, castling, promotionPiece} = move;
    const fromSq = getSquare(to.file, to.rank, state);
    const pieceToMove = liftSquarePiece(fromSq, state);
    const toSq = getSquare(from.file, from.rank, state);

    setPieceOn(pieceToMove, toSq);

    // undo the capture
    if (capture) {
        setPieceOn(capture.piece, getSquare(capture.coord.file, capture.coord.rank, state));
    }

    if (enPassant && enPassant.from) {
        state.enPassantCoord = enPassant.from;
    }

    if (castling && castling.from) {
        state.castling = castling.from;
    }

    if (promotionPiece) {
        // store the state of what the promotion was for redo moves
        move.promotionPiece = pieceToMove?.type;
        // when going back, we always go back to a pawn
        changePiece({file: toSq.file, rank: toSq.rank}, 'pawn', state);
    }

    return state;
}

export const executeMovesBackwards: (moves: move[], state: BoardState) => BoardState = (moves: move[], state: BoardState) => {
    state = {...state};
    moves.forEach(move => state = executeMoveBackwards(move, state));
    return state;
}

/**
 * moves a piece from -> to without checking if it is legal etc
 * @param capture - a capture to make, if one was made on a sqaure other than the 'to' sqaure
 *      (usually for en passant captures when going forwards in history)
 */
const executeMove: (move: move, state: BoardState) => void = ({from, to, capture, enPassant, castling}: move, state: BoardState) => {

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

    if (enPassant && enPassant.to) {
        state.enPassantCoord = enPassant.to;
    }

    if (castling && castling.to) {
        state.castling = castling.to;
    }

}

export const executeMoves: (moves: move[], state: BoardState) => void = (moves: move[], state: BoardState) => {
    moves.forEach(move => executeMove(move, state));
}

export const executeHistoryMoves: (moves: move[], state: BoardState) => void = (moves: move[], state: BoardState) => {
    moves.forEach(move => {
        executeMove(move, state);
        if (move.promotionPiece) {
            changePiece(move.to, move.promotionPiece, state);
        }
    });
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
const getEnPassantState: (fromSq: coord, toSq: coord, pieceToMove: Piece) => coord | undefined = (fromSq: coord, toSq: coord, pieceToMove: Piece) => {
    // if the piece is a pawn and has moved 2 squares
    if (pieceToMove.type === 'pawn' && Math.abs(fromSq.rank - toSq.rank) === 2) {
        // get square to be marked
        return { // capture square is where the pawn can be captured
            file: fromSq.file,
            rank: (fromSq.rank + toSq.rank) / 2 as rank // average of the 'from' and 'to' ranks will be the middle rank
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
 * Gets an object that describes how a piece was captured, if a piece exists on that square
 */
const getPieceCapture: (square: SquareState, state: BoardState) => capture | undefined = (square: SquareState, state: BoardState) => {

    const capturedPiece = square.piece

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
 * Generates the moves required to play the move without changing anything in the state
 */
export const getMoves: (from: coord, to: coord, state: BoardState) => move[] = (from: coord, to: coord, state: BoardState) => {
    const fromSq = getSquare(from.file, from.rank, state);
    const toSq = getSquare(to.file, to.rank, state);
    const pieceToMove = fromSq.piece;
    const moves: move[] = [];
    let castlingAvailability = state.castling;
    const promotionInitialised: boolean = (toSq.rank === 8 || toSq.rank === 1) && !!(fromSq && fromSq.piece && fromSq.piece.type === PAWN);
    const enPassantPieceCoord: coord | false = getEnPassantPieceCoord(state);

    // captureSquare is optionally different from the toSq (eg for en passant)
    const makeCaptureMove = (captureSquare: SquareState = toSq) => {
        moves.push({
            from: getCoordinates(fromSq),
            to: getCoordinates(toSq),
            capture: getPieceCapture(captureSquare, state),
        });
    };

    // capturing a piece
    if (fromSq.piece && toSq && toSq.piece && !compareSquarePieceColor(fromSq, toSq)) {
        makeCaptureMove();
    }
    // capturing by en passant
    else if (
        toSq && state.enPassantCoord && enPassantPieceCoord &&
        compareSquareCoords(toSq, state.enPassantCoord) &&
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
        });

        // castling - if moving a king more than 1 space
        if (fromSq.piece.type === 'king' && distanceBetweenFiles(fromSq.file, toSq.file) > 1) {

            // move rook to other side of king
            if (fromSq.file < toSq.file) {
                // short castling
                const rookSq = getSquare('h', fromSq.rank, state);
                if (rookSq.piece) {

                    const symbolToRevoke: castlingSymbol = fromSq.piece.color === 'white' ? 'K' : 'k';
                    moves.push({
                        from: {file: 'h', rank: fromSq.rank},
                        to: {file: 'f', rank: fromSq.rank},
                        castling: {
                            from: castlingAvailability,
                            to: revokeCastlingRights(castlingAvailability, [symbolToRevoke])
                        }
                    });
                }
            } else {
                // long castling
                const rookSq = getSquare('a', fromSq.rank, state);
                if (rookSq.piece) {

                    const symbolToRevoke: castlingSymbol = fromSq.piece.color === 'white' ? 'Q' : 'q';
                    moves.push({
                        from: {file: 'a', rank: fromSq.rank},
                        to: {file: 'd', rank: fromSq.rank},
                        castling: {
                            from: castlingAvailability,
                            to: revokeCastlingRights(castlingAvailability, [symbolToRevoke])
                        }
                    });
                }
            }
        }

    }

    // TODO: note this updates the state and we want this to be a pure function
    if (promotionInitialised) {
        state.promotionIntent = moves[0];
    }

    // If a move was made
    if (pieceToMove && moves.length > 0) {
        // set old and new en passant state in first move
        moves[0].enPassant = {
            from: state.enPassantCoord,
            to: getEnPassantState(fromSq, toSq, pieceToMove)
        };

        // TODO: clear en passant state here? It's sticking around longer than allowed
    }

    return moves;
}

export const getPromotionMove: (from: coord, to: coord, promotionPiece: pieceType) => move[] = (from: coord, to: coord, promotionPiece: pieceType) => {
    return [{ from, to, promotionPiece }];
}

/**
 * Public interface for playing a list of moves
 */
 export const playMoves: (moves: move[], state: BoardState) => BoardState = (moves: move[], state: BoardState) => {

    executeMoves(moves, state);

    if (moves.length > 0) {

        const completedPromotionMove = moves.find(m => m.promotionPiece);

        // only add a completed promotion move to the history
        if (!state.promotionIntent || completedPromotionMove) {
            state.undoHistory.push(moves);
            state.redoHistory = [];
        }

        if (completedPromotionMove && completedPromotionMove.promotionPiece) {
            // it's a completed promotion move - so promote the piece
            changePiece(completedPromotionMove.to, completedPromotionMove.promotionPiece, state);

            // set the promotionPiece in the move history
            if(state.undoHistory && state.undoHistory.length > 0) {
                // update the latest entry
                state.undoHistory[state.undoHistory.length - 1][0].promotionPiece = completedPromotionMove.promotionPiece;

                // promotion intent will not be available to opposing online player when the opponent promotes,
                // but we only need it for history so it should be ok
                if (state.promotionIntent) {
                    state.undoHistory[state.undoHistory.length - 1][0].capture = state.promotionIntent.capture;
                }
            }

            state.promotionIntent = undefined;
        }

        // only switch player if a piece was moved and we're not waiting on selecting a promotion
        if (!state.promotionIntent) {
            state = switchPlayer(state);
        }
    }

    state = clearActiveSq(state);

    return state;
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
