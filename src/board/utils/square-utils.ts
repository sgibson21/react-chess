import { Piece } from './piece-utils';
import { coord, file, rank, squareColor } from '../types';

export type SquareState = {
    file: file;
    rank: rank;
    available: boolean;   
    piece: Piece | null;
}

export const getColor: (square: SquareState) => squareColor = (square: SquareState) => {
    const fileEven = square.file.charCodeAt(0) % 2 === 0;
    const rankEven = square.rank % 2 === 0;
    return fileEven === rankEven ? 'dark' : 'light';
}

export const setAvailable = (available: boolean, square: SquareState) => {
    square.available = available;
}

export const setPiece = (piece: Piece, square: SquareState) => {
    square.piece = piece;
}

export const liftPiece: (square: SquareState) => Piece | undefined = (square: SquareState) => {
    if (square.piece) {
        const piece = square.piece;
        square.piece = null;
        return piece;
    }
}

export const getCoordinates: (square: SquareState) => coord = (square: SquareState) => {
    return { file: square.file, rank: square.rank };
}

