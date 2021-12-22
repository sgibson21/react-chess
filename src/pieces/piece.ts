import { pieceColor, pieceImgKey, piecePoints, pieceType } from "../board/types";

export class Piece {
    constructor(
        public color: pieceColor,
        public type: pieceType,
        public imgClass: pieceImgKey,
        public points?: piecePoints
    ) { }
}
