import { Piece } from '../pieces/piece';
import { BoardInternalState } from './board-utils';
import {
    getPlayingColor,
    getPlayingDirection,
    getSquare,
    getSquareFrom
} from './board-utils';
import { coord, direction, knightDirection, pieceColor, pieceType } from './types';

/**
 * Attack vectors for any given piece, by a ranged piece.
 * This groups the specific movement of a piece with its pieceType.
 *
 * A grouping of directions and what pieces can move in those directions.
 */
type attackVector = {
    directions: direction[];
    pieceTypes: pieceType[];
    ranged: boolean;
};

/**
 * directions to check in a straight line for an attacking bishop, queen - nw, ne, se, sw
 */
const diagonalDirections: direction[] = [
    { file: -1, rank: 1 },
    { file: 1, rank: 1 },
    { file: 1, rank: -1 },
    { file: -1, rank: -1 }
];

/**
 * directions to check in a straight line for an attacking rook, queen - n, e, s, w
 */
const straightDirections: direction[] = [
    { file: 0, rank: 1 },
    { file: 1, rank:  0},
    { file: 0, rank: -1 },
    { file: -1, rank: 0 },
];

/**
 * relative coordinates to check for an attacking knight
 */
const knightDirections: knightDirection[] = [
    { file: 1, rank: 2},
    { file: 2, rank: 1},
    { file: 2, rank: -1},
    { file: 1, rank: -2},
    { file: -1, rank: -2},
    { file: -2, rank: -1},
    { file: -2, rank: 1},
    { file: -1, rank: 2}
];

/**
 * Ranged piece types and the directions in which they can move
 */
const attackVectors: attackVector[] = [
    {
        directions: diagonalDirections,
        pieceTypes: ['bishop', 'queen'],
        ranged: true
    },
    {
        directions: straightDirections,
        pieceTypes: ['rook', 'queen'],
        ranged: true
    },
    {
        directions: [...diagonalDirections, ...straightDirections],
        pieceTypes: ['king'],
        ranged: false
    }
];

    
/**
 * Checks if a square is being attacked by any piece, including pawns.
 * The square does not have to have a piece on it.
 * @param board the board state
 * @param coordinate the coordinate of a square to check if it is attacked
 * @returns 
 */
export const isAttacked: (board: BoardInternalState, { file, rank }: coord) => boolean = (board: BoardInternalState, { file, rank }: coord) => {

    const square = getSquare(file, rank, board);
    const defendingColor = getPlayingColor(board);

    if (square.piece && square.piece.color !== defendingColor) {
        // the opposing player cannot attack thier own piece
        return false;
    }

    // push pawn attack vectors into the array dynamically, as the direction is based on playing direction of the pawn
    const direction = getPlayingDirection(board);
    const pawnAttackVector: attackVector = {
        directions: [{ file: -1, rank: direction }, { file: 1, rank: direction }],
        pieceTypes: ['pawn'],
        ranged: false
    };

    let attackingPiece: Piece | undefined = scoutLines(board, { file, rank }, [...attackVectors, pawnAttackVector], defendingColor);

    if (!attackingPiece) {
        attackingPiece = scoutKnights(board, { file, rank }, defendingColor);
    }

    if (attackingPiece) {
        return true;
    }

    return false;
}

/**
 * Gets the first found instance of an attacking piece moving in a straight line, ie: a piece which:
 *      is of the opposing color, and
 *      has the ability to move in that particular diection and range
 *      NOTE: Does not find attacking knights
 *
 * @param board the board state
 * @param fromSq the square from which to look from in a straight line, for a piece of the opposite color, in the given direction
 * @param attackVectors a grouping of directions and what pieces can move in those directions
 * @param defendingColor the color of the defending piece
 */
const scoutLines: (board: BoardInternalState, fromSq: coord, attackVectors: attackVector[], defendingColor: pieceColor) => Piece | undefined = (board: BoardInternalState, fromSq: coord, attackVectors: attackVector[], defendingColor: pieceColor) => {
    let attackingPiece: Piece | undefined;

    attackVectors.find(({directions, pieceTypes, ranged}: attackVector) => {
        return directions.find(dir => {
            const pieceInSight: Piece | undefined = ranged ?
                getPieceInLineOfSight(board, fromSq, dir) : getAdjacentPiece(board, fromSq, dir);

            /**
             * There is a piece, it is of the opposing color, and it is a piece that
             * has the ability to move in the current direction, as defined in the attack vectors.
             */
            const attacked: boolean = !!pieceInSight &&
                pieceInSight.color !== defendingColor &&
                pieceTypes.some(pieceType => pieceType === pieceInSight.type);

            if (attacked) {
                attackingPiece = pieceInSight;
            }

            return attacked;

        });
    });

    return attackingPiece;
}

/**
 * Gets the first found instance of an attacking knight moving as defined by the knightDirections
 * @param board the board state
 * @param fromSq the square from which to look from for attacking knights
 * @param defendingColor the color of the defending piece
 */
const scoutKnights: (board: BoardInternalState, fromSq: coord, defendingColor: pieceColor) => Piece | undefined = (board: BoardInternalState, fromSq: coord, defendingColor: pieceColor) => {
    let attackingPiece: Piece | undefined;

    knightDirections.find((knightDirection: knightDirection) => {
        const targetSq = getSquareFrom(fromSq.file, knightDirection.file, fromSq.rank, knightDirection.rank);

        if (targetSq) {
            const sq = getSquare(targetSq.file, targetSq.rank, board);

            if (sq.piece && sq.piece.type === 'knight' && sq.piece.color !== defendingColor) {
                attackingPiece = sq.piece;
                return true;
            }
        }
    });

    return attackingPiece;
}

/**
 * Gets the piece which has a direct line of sight to the 'from square' (fromSq)
 *
 * If there is no piece it returns undefined
 *
 * @param board the board state
 * @param fromSq the square from which to look from in a straight line, for a piece, in the given direction
 * @param direction the direction in which to look in a straight line
 */
const getPieceInLineOfSight: (board: BoardInternalState, fromSq: coord, direction: direction) => Piece | undefined = (board: BoardInternalState, fromSq: coord, direction: direction) => {
    let piece: Piece | undefined;
    let currentCoord: coord | undefined = fromSq;

    while (!piece && currentCoord) {
        // get the next coord in the given direction
        currentCoord = getSquareFrom(currentCoord.file, direction.file, currentCoord.rank, direction.rank);

        if (currentCoord) {
            const sq = getSquare(currentCoord.file, currentCoord.rank, board);
            
            if (sq.piece) {
                piece = sq.piece;
            }
        }
    }

    return piece;
}

/**
 * Gets the piece at the square one sqaure away from the given coordinate in the given direction
 * @param board 
 * @param fromSq 
 * @param direction 
 */
const getAdjacentPiece:(board: BoardInternalState, fromSq: coord, direction: direction) => Piece | undefined = (board: BoardInternalState, fromSq: coord, direction: direction) => {
    // get the coord in the given direction
    const targetSq = getSquareFrom(fromSq.file, direction.file, fromSq.rank, direction.rank);

    if (targetSq) {
        const piece = getSquare(targetSq.file, targetSq.rank, board).piece;

        if (piece) {
            return piece;
        }
    }
}
