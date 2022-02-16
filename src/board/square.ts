import { Piece } from "../pieces/piece";
import { coord, file, rank, squareColor } from "./types";

export class Square {

    public available: boolean;
    
    public piece: Piece | null;

    constructor(
        public file: file,
        public rank: rank
    ) { }

    getColor(): squareColor {
        const fileEven = this.file.charCodeAt(0) % 2 === 0;
        const rankEven = this.rank % 2 === 0;
        return fileEven === rankEven ? 'dark' : 'light';
    }

    setAvailable(available: boolean) {
        this.available = available;
    }

    public setPiece(piece: Piece): void {
        this.piece = piece;
    }

    public liftPiece(): Piece | undefined {
        if (this.piece) {
            const piece = this.piece;
            this.piece = null;
            return piece;
        }
    }

    public getCoordinates(): coord {
        return { file: this.file, rank: this.rank };
    }
    
}
