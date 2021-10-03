import { Piece } from '../pieces/piece';
import { file, pieceColor, rank, square } from './types';
import * as pieces from '../pieces/pieces';
import { Square } from './Square';
import { PieceNavigator } from '../pieces/piece-navigator';

export const files: file[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const ranks: rank[] = [1, 2, 3, 4, 5, 6, 7, 8];

export class BoardState {
    public state: {
        [file: string]: {
            [rank: number]: Square
        }
    } = {};

    private navigator: PieceNavigator;

    private activeSq: Square | null;

    private availableSquares: Square[] = [];

    private playersTurn: pieceColor = 'white';

    constructor() {
        this.initSquares();
        this.initPieces();
        this.navigator = new PieceNavigator();
    }

    public getSquare(file: file, rank: rank): Square {
        return this.state[file][rank];
    }

    public setActiveSquare(file: file, rank: rank): BoardState {
        this.activeSq = this.state[file][rank];
        this.availableSquares = this.navigator.getPieceMovement(this, this.activeSq);
        return this;
    }

    public clearActiveSq(): BoardState {
        this.activeSq = null;
        this.clearAvailableSquares();
        return this;
    }

    public hasActiveSq(): boolean {
        return !!this.activeSq;
    }

    public isActiveSq(file: file, rank: rank): boolean {
        return !!this.activeSq && this.activeSq.file === file && this.activeSq.rank === rank;
    }

    public isAvailableSquare(file: file, rank: rank): boolean {
        return !!this.availableSquares.find(sq => sq.file === file && sq.rank === rank);
    }

    public isPlayersTurn(file: file, rank: rank): boolean {
        return this.state[file][rank].piece?.color === this.playersTurn;
    }

    public isOwnPiece(file: file, rank: rank): boolean {
        return this.getSquare(file, rank).piece?.color === this.playersTurn;
    }

    public getPlayingDirection(): 1 | -1 {
        return this.playersTurn === 'white' ? 1 : -1;
    }

    /**
     * Moves the piece in the active square to the given square
     */
    public movePieceTo(to: square): BoardState {
        if (this.activeSq && !this.isActiveSq(to.file, to.rank) && this.isAvailableSquare(to.file, to.rank)) {

            // TODO: check if piece can move

            // move piece to new square
            const pieceMoved = this.movePiece(to);

            // only switch player if a piece was moved
            if (pieceMoved) {
                this.switchPlayer();
            }

            this.clearActiveSq();
            this.clearAvailableSquares();
        }

        return this;
    }

    private movePiece(to: square): boolean {
        let pieceMoved: boolean = false;
        const fromSq = this.activeSq;
        const toSq = this.state[to.file][to.rank];

        // capturing a piece
        if (fromSq && fromSq.piece && toSq.piece && fromSq.piece.color !== toSq.piece.color) {
            this.capturePiece(toSq);
            this.setPieceOn(fromSq.liftPiece(), toSq);
            pieceMoved = true;
        }
        // moving to an empty square
        else if (fromSq && fromSq.piece && !toSq.piece) {
            this.setPieceOn(fromSq.liftPiece(), toSq);
            pieceMoved = true;
        }

        return pieceMoved;
    }

    /**
     * Sets piece on given square 
     */
    private setPieceOn(piece: Piece | undefined, square: Square): void {
        if (piece) {
            square.setPiece(piece);
        }
    }

    /**
     * Captures piece on given square
     */
    private capturePiece(square: Square): void {

        // lift piece to be taken
        const capturedPice = square.liftPiece();

        // add captured piece to current players stash
        // TODO

    }

    private clearAvailableSquares(): void {
        this.availableSquares = [];
    }

    private switchPlayer(): void {
        this.playersTurn = this.playersTurn === 'white' ? 'black' : 'white';
    }

    private initSquares(): void {
        this.state = {};
        files.forEach(file => {
            ranks.forEach(rank => {
                if (!this.state[file]) {
                    this.state[file] = {
                        [rank]: new Square(file, rank)
                    };
                } else if (!this.state[file][rank]) {
                    this.state[file][rank] = new Square(file, rank);
                }
            })
        });
    }

    private initPieces(): void {

        // white pieces
        this.addPiece(pieces.WHITE_ROOK, 'a', 1);
        this.addPiece(pieces.WHITE_KNIGHT, 'b', 1);
        this.addPiece(pieces.WHITE_BISHOP, 'c', 1);
        this.addPiece(pieces.WHITE_QUEEN, 'd', 1);
        this.addPiece(pieces.WHITE_KING, 'e', 1);
        this.addPiece(pieces.WHITE_BISHOP, 'f', 1);
        this.addPiece(pieces.WHITE_KNIGHT, 'g', 1);
        this.addPiece(pieces.WHITE_ROOK, 'h', 1);
        files.map(file => this.addPiece(pieces.WHITE_PAWN, file, 2));

        // black pieces
        this.addPiece(pieces.BLACK_ROOK, 'a', 8);
        this.addPiece(pieces.BLACK_KNIGHT, 'b', 8);
        this.addPiece(pieces.BLACK_BISHOP, 'c', 8);
        this.addPiece(pieces.BLACK_QUEEN, 'd', 8);
        this.addPiece(pieces.BLACK_KING, 'e', 8);
        this.addPiece(pieces.BLACK_BISHOP, 'f', 8);
        this.addPiece(pieces.BLACK_KNIGHT, 'g', 8);
        this.addPiece(pieces.BLACK_ROOK, 'h', 8);
        files.map(file => this.addPiece(pieces.BLACK_PAWN, file, 7));
    }

    /**
     * Helper method for adding new pieces to the board
     */
    private addPiece(piece: Piece, file: file, rank: rank): void {
        const square = this.state[file][rank];
        if (square) {
            square.setPiece(piece);
        }
    }
}
