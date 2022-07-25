import { pieceColor, pieceImgKey, piecePoints, pieceType } from '../board/types';
import { UnidentifiedPiece } from './piece';

export const COLOR_WHITE: pieceColor = 'white';
export const COLOR_BLACK: pieceColor = 'black';

export const KING: pieceType = 'king';
export const QUEEN: pieceType = 'queen';
export const ROOK: pieceType = 'rook';
export const BISHOP: pieceType = 'bishop';
export const KNIGHT: pieceType = 'knight';
export const PAWN: pieceType = 'pawn';

const pieceColorSymbolMap = {
    [COLOR_WHITE]: 'w',
    [COLOR_BLACK]: 'b',
};

const pieceTypeSymbolMap = {
    [KING]:   'k',
    [QUEEN]:  'q',
    [ROOK]:   'r',
    [BISHOP]: 'b',
    [KNIGHT]: 'n',
    [PAWN]:   'p'
};

const pieceTypePointsMap = {
    [KING]:   undefined,
    [QUEEN]:  9,
    [ROOK]:   5,
    [BISHOP]: 3,
    [KNIGHT]: 3,
    [PAWN]:   1
};

export const getPiece: (color: pieceColor, type: pieceType) => UnidentifiedPiece = (color: pieceColor, type: pieceType) => {
    const imgClass = pieceColorSymbolMap[color] + pieceTypeSymbolMap[type] as pieceImgKey;
    const points = pieceTypePointsMap[type] as piecePoints;
    return { color, type, imgClass, points, hasMoved: false };
}
