import { pieceColor, piecePoints, pieceType } from "../board/types";

export class Piece {
    constructor(
        public color: pieceColor,
        public type: pieceType,
        public imgClass: string,
        public points?: piecePoints
    ) { }
}
