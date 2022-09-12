import { BoardState, isCastlingAvailable } from './board-utils';
import {
    getEnPassantCaptureSq,
    getEnPassantPieceSq,
    getPlayingDirection,
    getSquare,
    isInCheck,
    simulateMove,
    getFileFrom,
    getSquareFrom,
} from './board-utils';
import { getCoordinates, SquareState } from './square-utils';
import { pieceType, rank, direction } from '../types';
    
const navigatorMap: Record<pieceType, (boardState: BoardState, fromSquare: SquareState) => SquareState[]> = {
    pawn: (boardState: BoardState, fromSquare: SquareState) => pawnMovement(boardState, fromSquare),
    knight: (boardState: BoardState, fromSquare: SquareState) => knightMovement(boardState, fromSquare),
    bishop: (boardState: BoardState, fromSquare: SquareState) => bishopMovement(boardState, fromSquare),
    rook: (boardState: BoardState, fromSquare: SquareState) => rookMovement(boardState, fromSquare),
    queen: (boardState: BoardState, fromSquare: SquareState) => queenMovement(boardState, fromSquare),
    king: (boardState: BoardState, fromSquare: SquareState) => kingMovement(boardState, fromSquare)
};

export const getPieceMovement: (boardState: BoardState, square: SquareState) => SquareState[] = (boardState: BoardState, square: SquareState) => {
    const piece = square.piece;

    if (piece) {
        return navigatorMap[piece.type](boardState, square)
            .filter(toSq => {
                const move = {from: getCoordinates(square), to: getCoordinates(toSq)};
                return !simulateMove({
                    move: move,
                    callback: (sim: BoardState) => isInCheck(sim),
                    state: boardState
                });
            });
    }

    return [];
}

const pawnMovement: (boardState: BoardState, fromSquare: SquareState) => SquareState[] = (boardState: BoardState, fromSquare: SquareState) => {
    const movements: SquareState[] = [];

    // gets the direction the piece moves, based on piece color
    const direction = getPlayingDirection(boardState);

    let distanceAllowed: number = 0;
    if ((direction > 0 && fromSquare.rank < 8) || (direction < 0 && fromSquare.rank > 1)) {
        distanceAllowed++;
    }

    // can move 2 spaces forward if it's the first pawn movement (ie, it's on the 2nd rank)
    if ((direction > 0 && fromSquare.rank === 2) || (direction < 0 && fromSquare.rank === 7)) {
        distanceAllowed++;
    }

    // moving forward (including 2 squares on first movement)
    movements.push(...getPawnPath(boardState, fromSquare, direction, distanceAllowed));

    // captures
    movements.push(...getPawnCaptures(boardState, fromSquare, direction));

    // en passant
    movements.push(...getEnPassant(boardState, fromSquare));

    // TODO: queening
    
    return movements;
}

const knightMovement: (boardState: BoardState, squareFrom: SquareState) => SquareState[] = (boardState: BoardState, squareFrom: SquareState) => {
    const movements: SquareState[] = [];

    const coords = [
        { file: 1, rank: 2},
        { file: 2, rank: 1},
        { file: 2, rank: -1},
        { file: 1, rank: -2},
        { file: -1, rank: -2},
        { file: -2, rank: -1},
        { file: -2, rank: 1},
        { file: -1, rank: 2}
    ];

    coords.forEach(coord => {
        const sq = getSquareFrom(squareFrom.file, coord.file, squareFrom.rank, coord.rank);
        if (sq) {
            const squareTo = getSquare(sq.file, sq.rank, boardState);
            if (!squareTo.piece || squareTo.piece.color !== squareFrom.piece?.color) {
                movements.push(squareTo);
            }
        }
    });

    return movements;
}

const bishopMovement: (boardState: BoardState, square: SquareState) => SquareState[] = (boardState: BoardState, square: SquareState) => {
    return [
        ...getBishopPath(boardState, square, 1, 1),
        ...getBishopPath(boardState, square, -1, 1),
        ...getBishopPath(boardState, square, 1, -1),
        ...getBishopPath(boardState, square, -1, -1),
    ];
}

const rookMovement: (boardState: BoardState, square: SquareState) => SquareState[] = (boardState: BoardState, square: SquareState) => {
    return [
        ...getRookPath(boardState, square, 1),
        ...getRookPath(boardState, square, -1),
        ...getRookPath(boardState, square, 1, true),
        ...getRookPath(boardState, square, -1, true),
    ];
}

const queenMovement: (boardState: BoardState, square: SquareState) => SquareState[] = (boardState: BoardState, square: SquareState) => {
    return [
        ...bishopMovement(boardState, square),
        ...rookMovement(boardState, square),
    ];
}

const kingMovement: (boardState: BoardState, square: SquareState) => SquareState[] = (boardState: BoardState, square: SquareState) => {
    const movements: SquareState[] = [];
    const coords: direction[] = [
        { file: -1, rank: 1},
        { file: 0, rank: 1},
        { file: 1, rank: 1},
        { file: -1, rank: 0},
        { file: 1, rank: 0},
        { file: -1, rank: -1},
        { file: 0, rank: -1},
        { file: 1, rank: -1}
    ];
    
    coords.forEach(coord => {
        const sq = getSquareFrom(square.file, coord.file, square.rank, coord.rank);
        if (sq) {
            const squareTo = getSquare(sq.file, sq.rank, boardState);
            if (!squareTo.piece || squareTo.piece.color !== square.piece?.color) {
                movements.push(squareTo);
            }
        }
    });

    // castling - path to rook is clear, not in line of sight of attacking piece and castling is available
    const [kingSideAvailable, queenSideAvailable] = isCastlingAvailable(square.piece?.color, boardState);
    if (square.piece && (kingSideAvailable || queenSideAvailable)) {
        // short castling is always towards the h file, long towards the a file
        const pathToRookShort = getRookPath(boardState, square, 1, false);
        const pathToRookLong = getRookPath(boardState, square, -1, false);

        const rookAtShortCoord = getSquareFrom(square.file, 3, square.rank, 0);
        const rookAtLongCoord = getSquareFrom(square.file, -4, square.rank, 0);
        
        if (rookAtShortCoord) {
            const rookAtShortSq = getSquare(rookAtShortCoord.file, rookAtShortCoord.rank, boardState);

            if (pathToRookShort.length === 2 && rookAtShortSq.piece && kingSideAvailable) {

                // path to king's final position should not be in the line of sight of an attacking piece
                const pathInCheck: boolean = simulateMove({
                    move: {
                        from: {file: square.file, rank: square.rank},
                        to: {file: pathToRookShort[0].file, rank: pathToRookShort[0].rank}
                    },
                    callback: (sim: BoardState) => isInCheck(sim),
                    state: boardState
                });

                if (!pathInCheck) {
                    movements.push(pathToRookShort[1]);
                }
            }
        }

        if (rookAtLongCoord) {
            const rookAtLongSq = getSquare(rookAtLongCoord.file, rookAtLongCoord.rank, boardState);

            if (pathToRookLong.length === 3 && rookAtLongSq.piece && queenSideAvailable) {

                // path to king's final position should not be in the line of sight of an attacking piece
                const pathInCheck: boolean = simulateMove({
                    move: {
                        from: {file: square.file, rank: square.rank},
                        to: {file: pathToRookLong[0].file, rank: pathToRookLong[0].rank}
                    },
                    callback: (sim: BoardState) => isInCheck(sim),
                    state: boardState
                });

                if (!pathInCheck) {
                    movements.push(pathToRookLong[1]);
                }
            }
        }

    }

    return movements;
}

/**
 * Gets the path for the forward movement up a rank, until a piece is in the way.
 * 
 * That path does NOT include the piece
 */
const getPawnPath: (boardState: BoardState, from: SquareState, direction: 1 | -1, distance: number) => SquareState[] = (boardState: BoardState, from: SquareState, direction: 1 | -1, distance: number) => {
    const path = [];
    for (let i = 1; i <= distance; i++) {
        const square = getSquare(from.file, from.rank + (direction * i) as rank, boardState);
        if (!square.piece) {
            path.push(square);
        } else {
            break;
        }
    }
    return path;
}

const getPawnCaptures: (boardState: BoardState, from: SquareState, direction: 1 | -1) => SquareState[] = (boardState: BoardState, from: SquareState, direction: 1 | -1) => {
    const captures: SquareState[] = [];
    const fileDirections = [1, -1];
    const coords = fileDirections.map(fileDir => getSquareFrom(from.file, fileDir, from.rank, direction)).filter(x => !!x);
    coords.forEach(coord => {
        if (coord) {
            const captureSq = getSquare(coord.file, coord.rank, boardState);
            if (captureSq.piece && captureSq.piece.color !== from.piece?.color) {
                captures.push(captureSq);
            }
        }
    })
    return captures;
}

const getEnPassant: (boardState: BoardState, fromSquare: SquareState) => SquareState[] = (boardState: BoardState, fromSquare: SquareState) => {
    const movements: SquareState[] = [];

    const enPassantCaptureSq = getEnPassantCaptureSq(boardState);
    const enPassantPieceSq = getEnPassantPieceSq(boardState);

    // if the capturing piece is on the same rank as the en passant piece square
    if (enPassantCaptureSq && enPassantPieceSq && fromSquare.rank === enPassantPieceSq.rank) {

        const fileLeft = getFileFrom(fromSquare.file, -1);
        const fileRight = getFileFrom(fromSquare.file, 1);

        // AND the capturing piece is either on the file to the left OR right of the en passant capture square
        if (enPassantPieceSq.file === fileLeft || enPassantPieceSq.file === fileRight) {
            movements.push(getSquare(enPassantCaptureSq.file, enPassantCaptureSq.rank, boardState));
        }
    }

    return movements;
}

const getBishopPath: (boardState: BoardState, from: SquareState, fileDirection: 1 | -1, rankDirection: 1 | -1) => SquareState[] = (boardState: BoardState, from: SquareState, fileDirection: 1 | -1, rankDirection: 1 | -1) => {
    const path: SquareState[] = [];

    // describes if no pieces are blocking the path up to this point
    let openPath: boolean;
    let count = 0;

    do {
        openPath = false;
        count++;

        const coords = getSquareFrom(from.file, fileDirection * count, from.rank, rankDirection * count);
        if (coords) {
            const sq = getSquare(coords.file, coords.rank, boardState);

            // If there's no piece, continue on the path
            if (!sq.piece) {
                openPath = true;
            }

            // add to the path if there's no piece or it's not the player's own piece
            if (!sq.piece || sq.piece.color !== from.piece?.color) {
                path.push(sq);
            }
        }

    } while (openPath)

    return path;
}

/**
 * Gets a path for a Rook
 * @param isRankPath Is it a path along a rank?
 * @returns 
 */
const getRookPath: (boardState: BoardState, from: SquareState, direction: 1 | -1, isRankPath?: boolean) => SquareState[] = (boardState: BoardState, from: SquareState, direction: 1 | -1, isRankPath = false) => {
    const path: SquareState[] = [];

    // describes if...
    let openPath: boolean;
    let count = 0;

    do {
        openPath = false;
        count++;

        const coords = isRankPath ? getSquareFrom(from.file, 0, from.rank, direction * count) :
            getSquareFrom(from.file, direction * count, from.rank, 0);
        if (coords) {
            const sq = getSquare(coords.file, coords.rank, boardState);

            // If there's no piece, continue on the path
            if (!sq.piece) {
                openPath = true;
            }

            // add to the path if there's no piece or it's not the player's own piece
            if (!sq.piece || sq.piece.color !== from.piece?.color) {
                path.push(sq);
            }
        }

    } while (openPath)

    return path;
}

