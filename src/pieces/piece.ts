import { pieceColor, pieceImgKey, piecePoints, pieceType } from "../board/types";

export class Piece {

    public hasMoved = false;

    constructor(
        public color: pieceColor,
        public type: pieceType,
        public imgClass: pieceImgKey,
        public points: piecePoints,
        public id: string
    ) { }
}
