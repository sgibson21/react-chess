import { pieceColor, pieceImgKey, piecePoints, pieceType } from "../board/types";

// An UnidentifiedPiece is a piece with no ID
// with the intent for an ID to be given once all pieces are created
export type UnidentifiedPiece = {
    color: pieceColor;
    type: pieceType;
    imgClass: pieceImgKey;
    points: piecePoints;
    hasMoved: boolean;
};

export interface Piece extends UnidentifiedPiece {
    id: string;
}
