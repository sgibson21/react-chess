import { pieceColor, pieceImgKey, piecePoints, pieceType } from "../board/types";
import { Piece } from "./piece";

const COLOR_WHITE: pieceColor = 'white';
const COLOR_BLACK: pieceColor = 'black';

export const KING: pieceType = 'king';
export const QUEEN: pieceType = 'queen';
export const ROOK: pieceType = 'rook';
export const BISHOP: pieceType = 'bishop';
export const KNIGHT: pieceType = 'knight';
export const PAWN: pieceType = 'pawn';

export const WHITE = getColoredPieceBlueprint(COLOR_WHITE);
export const BLACK = getColoredPieceBlueprint(COLOR_BLACK);

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

function getColoredPieceBlueprint(color: pieceColor) {
    return {
        [KING]:   getPieceBlueprint(color, KING),
        [QUEEN]:  getPieceBlueprint(color, QUEEN),
        [ROOK]:   getPieceBlueprint(color, ROOK),
        [BISHOP]: getPieceBlueprint(color, BISHOP),
        [KNIGHT]: getPieceBlueprint(color, KNIGHT),
        [PAWN]:   getPieceBlueprint(color, PAWN)
    };
}


function getPieceBlueprint(color: pieceColor, type: pieceType) {
    return class extends Piece {
        constructor() {
            super(
                color,
                type,
                pieceColorSymbolMap[color] + pieceTypeSymbolMap[type] as pieceImgKey,
                pieceTypePointsMap[type] as piecePoints | undefined
            );
        }
    }
}
