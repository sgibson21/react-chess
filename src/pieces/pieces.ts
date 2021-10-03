import { Piece } from "./piece";

export const WHITE_KING = new Piece('white', 'king', 'wk');
export const BLACK_KING = new Piece('black', 'king', 'bk');

export const WHITE_QUEEN = new Piece('white', 'queen', 'wq', 9);
export const BLACK_QUEEN = new Piece('black', 'queen', 'bq', 9);

export const WHITE_ROOK = new Piece('white', 'rook', 'wr', 5);
export const BLACK_ROOK = new Piece('black', 'rook', 'br', 5);

export const WHITE_BISHOP = new Piece('white', 'bishop', 'wb', 3);
export const BLACK_BISHOP = new Piece('black', 'bishop', 'bb', 3);

export const WHITE_KNIGHT = new Piece('white', 'knight', 'wn', 3);
export const BLACK_KNIGHT = new Piece('black', 'knight', 'bn', 3);

export const WHITE_PAWN = new Piece('white', 'pawn', 'wp', 1);
export const BLACK_PAWN = new Piece('black', 'pawn', 'bp', 1);
