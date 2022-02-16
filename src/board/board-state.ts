import { Piece } from '../pieces/piece';
import { enPassantState, file, pieceColor, pieceType, rank, coord } from './types';
import * as pieces from '../pieces/pieces';
import { Square } from './square';
import { BoardNavigator } from './board-navigator';
import { distanceBetweenFiles } from './utils';
import { BoardScout } from './board-scout';

export const files: file[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const ranks: rank[] = [1, 2, 3, 4, 5, 6, 7, 8];

export class BoardState {
    public state: {
        [file: string]: {
            [rank: number]: Square
        }
    } = {};

    private navigator: BoardNavigator;

    private scout: BoardScout;

    private activeSq: Square | null;

    private availableSquares: Square[] = [];

    private playersTurn: pieceColor = 'white';

    private enPassantState: enPassantState | undefined;

    constructor() {
        this.initSquares();
        this.initPieces();
        this.navigator = new BoardNavigator();
        this.scout = new BoardScout();
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

    public isOwnPiece(file: file, rank: rank): boolean {
        return this.getSquare(file, rank).piece?.color === this.playersTurn;
    }

    public isInCheck(): boolean {
        const kingSq = this.getSquareWithPiece('king', this.playersTurn);
        return !!kingSq && this.scout.isAttacked(this, kingSq.getCoordinates());
    }

    public getPlayingColor(): pieceColor {
        return this.playersTurn;
    }

    public getPlayingDirection(): 1 | -1 {
        return this.playersTurn === 'white' ? 1 : -1;
    }

    public getEnPassantCaptureSq(): coord | false {
        return !!this.enPassantState && this.enPassantState.captureSquare;
    }

    public getEnPassantPieceSq(): coord | false {
        return !!this.enPassantState && this.enPassantState.pieceSquare;
    }

    /**
     * Moves the piece in the active square to the given square
     */
    public movePieceTo(to: coord): BoardState {
        if (this.activeSq && !this.isActiveSq(to.file, to.rank) && this.isAvailableSquare(to.file, to.rank)) {

            // TODO: check if piece can move

            // move piece to new square
            const pieceMoved = this.movePiece(to);

            if (pieceMoved) {
                if (this.activeSq.piece) {
                    this.activeSq.piece.hasMoved = true;
                }
                // only switch player if a piece was moved
                this.switchPlayer();
            }

            this.clearActiveSq();
            this.clearAvailableSquares();
        }

        return this;
    }

    private getSquareWithPiece(type: pieceType, color: pieceColor): Square | undefined {
        let square: Square | undefined;
        for (const file of files) {
            for (const rank of ranks) {
                const sq = this.state[file][rank];
                if (sq.piece && sq.piece.type === type && sq.piece.color === color) {
                    square = sq;
                }
            }
        }
        return square;
    }

    /**
     * @returns (boolean) if a piece was moved or not
     */
    private movePiece(to: coord): boolean {
        let pieceToMove: Piece | undefined;
        const fromSq = this.activeSq;
        const toSq = this.state[to.file][to.rank];

        // capturing a piece
        if (fromSq && fromSq.piece && toSq && toSq.piece && !this.compareSquarePieceColor(fromSq, toSq)) {
            this.capturePiece(toSq);
            pieceToMove = fromSq.liftPiece();
            this.setPieceOn(pieceToMove, toSq);
        }
        // capturing by en passant
        else if (
            fromSq && toSq && this.enPassantState?.captureSquare &&
            this.compareSquareCoords(toSq, this.enPassantState.captureSquare) &&
            !this.compareSquarePieceColor(fromSq, this.getSquare(this.enPassantState.pieceSquare.file, this.enPassantState.pieceSquare.rank))
        ) {
            this.capturePieceByEnPassant();
            pieceToMove = fromSq.liftPiece();
            this.setPieceOn(pieceToMove, toSq);
        }
        // moving to an empty square
        else if (fromSq && fromSq.piece && !toSq.piece) {

            // castling - if moving a king more than 1 space
            if (fromSq.piece.type === 'king' && distanceBetweenFiles(fromSq.file, toSq.file) > 1) {

                // move rook to other side of king
                if (fromSq.file < toSq.file) {
                    // short castling
                    const rookSq = this.getSquare('h', fromSq.rank);
                    if (rookSq.piece) {
                        const rook = rookSq.liftPiece();
                        this.setPieceOn(rook, this.getSquare('f', fromSq.rank));
                    }
                } else {
                    // long castling
                    const rookSq = this.getSquare('a', fromSq.rank);
                    if (rookSq.piece) {
                        const rook = rookSq.liftPiece();
                        this.setPieceOn(rook, this.getSquare('d', fromSq.rank));
                    }
                }
            }

            // move piece (including castling king)
            pieceToMove = fromSq.liftPiece();
            this.setPieceOn(pieceToMove, toSq);
        }

        // clear and set new en passant state
        if (fromSq && pieceToMove) {
            this.enPassantState = this.getEnPassantState(fromSq, toSq, pieceToMove);
        }

        return !!pieceToMove;
    }

    /**
     * gets any en passant state if a pawn has been moved 2 squares
     */
    private getEnPassantState(fromSq: coord, toSq: coord, pieceToMove: Piece): enPassantState | undefined {
        // if the piece is a pawn and has moved 2 squares
        if (pieceToMove.type === 'pawn' && Math.abs(fromSq.rank - toSq.rank) === 2) {
            // get square to be marked
            return {
                captureSquare: { // capture square is where the pawn can be captured
                    file: fromSq.file,
                    rank: (fromSq.rank + toSq.rank) / 2 as rank // average of the 'from' and 'to' ranks will be the middle rank
                },
                pieceSquare: { // piece square is where the piece was moved to
                    file: toSq.file,
                    rank: toSq.rank
                }
            };
        }
    }

    /**
     * true if same color, false if not, false if either square has no piece
     */
    private compareSquarePieceColor(sq1: Square, sq2: Square): boolean {
        return !!sq1.piece && !!sq2.piece && sq1.piece.color === sq2.piece.color;
    }

    /**
     * true if coords are the same, false if not or if either param is falsey
     */
    private compareSquareCoords(sq1: coord, sq2: coord): boolean {
        return !!sq1 && !!sq2 && sq1.file === sq2.file && sq1.rank === sq2.rank;
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

    /**
     * Captures piece as defined by the en passant state
     */
    private capturePieceByEnPassant(): void {
        if (this.enPassantState?.pieceSquare) {

            // lift piece to be taken
            const capturedPice = this.getSquare(this.enPassantState.pieceSquare.file, this.enPassantState.pieceSquare.rank).liftPiece();

            // add captured piece to current players stash
            // TODO
        }
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
