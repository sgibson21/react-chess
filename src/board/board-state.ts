import { Piece } from '../pieces/piece';
import { enPassantState, file, pieceColor, pieceType, rank, coord } from './types';
import * as pieces from '../pieces/pieces';
import { Square } from './square';
import { BoardNavigator } from './board-navigator';
import { distanceBetweenFiles } from './utils';
import { BoardScout } from './board-scout';

export const files: file[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const ranks: rank[] = [1, 2, 3, 4, 5, 6, 7, 8];

type capture = {
    piece: Piece;
    coord: coord
};

type move = {
    from: coord;
    to: coord;
    capture?: capture;
    /**
     * optional callback used to reverse piece state: ie set hasMoved back to false
     */
    reverse?: () => void;
};

export class BoardState {
    public state: {
        [file: string]: {
            [rank: number]: Square
        }
    } = {};

    private undoHistory: move[][] = [];

    private redoHistory: move[][] = [];

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

    public back(): BoardState {
        if (this.undoHistory.length > 0) {
            const movesToUndo = this.undoHistory.splice(-1, 1)[0];
            this.makeHistoryMovesBackwards(movesToUndo);
            this.redoHistory.push(movesToUndo);
            this.switchPlayer();
        }
        return this;
    }

    public forward(): BoardState {
        if (this.redoHistory.length > 0) {
            const movesToRedo = this.redoHistory.splice(-1, 1)[0];
            this.makeHistoryMovesForwards(movesToRedo);
            this.undoHistory.push(movesToRedo);
            this.switchPlayer();
        }
        return this;
    }

    /**
     * Allows you to simulate a piece moving, providing the board state to the callback to run calculations,
     * then undos the move after the callback finishes
     * @param move - the move to simulate
     * @param callback - the callabck function in which to run calculations on the simulated board state
     * @returns - the return value of the callback
     */
    public simulateMove<T>({from, to}: {from: coord, to: coord}, callback: (state: BoardState) => T): T {
        // make move
        const capture = this.makeUnvalidatedMove(from, to);

        const returnValue = callback(this);

        // undo move
        this.makeHistoryMoveBackwards({from, to, capture});

        return returnValue;
    }

    /**
     * Moves the piece in the active square to the given square
     */
    public movePieceTo(to: coord): BoardState {
        if (this.activeSq && !this.isActiveSq(to.file, to.rank) && this.isAvailableSquare(to.file, to.rank)) {

            // move piece to new square
            const moves = this.movePiece(to);

            if (moves.length > 0) {

                this.undoHistory.push(moves);
                this.redoHistory = [];

                // only switch player if a piece was moved
                this.switchPlayer();
            }

            this.clearActiveSq();
            this.clearAvailableSquares();
        }

        return this;
    }

    /**
     * moves a piece from -> to without checking if it is legal etc
     * @returns a capture, if one was made
     */
    private makeUnvalidatedMove(from: coord, to: coord): capture | undefined {
        let capture: capture | undefined;

        const fromSq = this.getSquare(from.file, from.rank);
        const pieceToMove = fromSq.liftPiece();

        // set the piece on the sqare that the piece came from
        const toSq = this.getSquare(to.file, to.rank);

        // get the piece to take before you set the taking piece down
        if (toSq.piece) {
            capture = {
                piece: toSq.piece,
                coord: toSq.getCoordinates()
            };
        }

        this.setPieceOn(pieceToMove, toSq);

        return capture;
    }

    private makeHistoryMovesBackwards(moves: move[]): void {
        moves.forEach(move => this.makeHistoryMoveBackwards(move));
    }

    /**
     * moves a piece to -> from without checking if it is legal etc
     * @param capture - optional: a capture to undo
     */
    private makeHistoryMoveBackwards({from, to, capture, reverse}: move): void {
        const fromSq = this.getSquare(to.file, to.rank);
        const pieceToMove = fromSq.liftPiece();
        const toSq = this.getSquare(from.file, from.rank);

        this.setPieceOn(pieceToMove, toSq);

        // undo the capture
        if (capture) {
            this.setPieceOn(capture.piece, this.getSquare(capture.coord.file, capture.coord.rank));
        }

        // run the reverse callback if there is one
        if (reverse) {
            reverse();
        }
    }

    private makeHistoryMovesForwards(moves: move[]): void {
        moves.forEach(move => this.makeHistoryMoveForwards(move));
    }

    /**
     * moves a piece from -> to without checking if it is legal etc
     * @param capture - a capture to make, if one was made on a sqaure other than the 'to' sqaure
     *      (usually for en passant captures when going forwards in history)
     */
    private makeHistoryMoveForwards({from, to, capture}: move): void {

        const fromSq = this.getSquare(from.file, from.rank);
        const pieceToMove = fromSq.liftPiece();
        const toSq = this.getSquare(to.file, to.rank);

        // capture the piece before you set the taking piece down
        if (capture) {
            const capturedSq = this.getSquare(capture.coord.file, capture.coord.rank);
            capturedSq.liftPiece();

            // TODO: put this into players stash of taken pieces
        }

        this.setPieceOn(pieceToMove, toSq);
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
     * @returns a list of moves that were made
     * 
     * TODO: should a capture just be a move from the square -> to OFF the board and into the players stash?
     * 
     */
    private movePiece(to: coord): move[] {
        let pieceToMove: Piece | undefined;
        const moves: move[] = [];
        const fromSq = this.activeSq;
        const toSq = this.state[to.file][to.rank];

        // capturing a piece
        if (fromSq && fromSq.piece && toSq && toSq.piece && !this.compareSquarePieceColor(fromSq, toSq)) {
            const capture = this.capturePiece(toSq); // capture the piece before you set down the taking piece
            pieceToMove = fromSq.liftPiece();
            this.setPieceOn(pieceToMove, toSq);

            moves.push({
                from: fromSq.getCoordinates(),
                to: toSq.getCoordinates(),
                capture
            });
        }
        // capturing by en passant
        else if (
            fromSq && toSq && this.enPassantState?.captureSquare &&
            this.compareSquareCoords(toSq, this.enPassantState.captureSquare) &&
            !this.compareSquarePieceColor(fromSq, this.getSquare(this.enPassantState.pieceSquare.file, this.enPassantState.pieceSquare.rank))
        ) {
            const capture = this.capturePieceByEnPassant(); // capture the piece before you set down the taking piece
            pieceToMove = fromSq.liftPiece();
            this.setPieceOn(pieceToMove, toSq);

            moves.push({
                from: fromSq.getCoordinates(),
                to: toSq.getCoordinates(),
                capture
            });
        }
        // moving to an empty square
        else if (fromSq && fromSq.piece && !toSq.piece) {

            moves.push({
                from: fromSq.getCoordinates(),
                to: toSq.getCoordinates(),
                capture: undefined
            });

            // castling - if moving a king more than 1 space
            if (fromSq.piece.type === 'king' && distanceBetweenFiles(fromSq.file, toSq.file) > 1) {

                // move rook to other side of king
                if (fromSq.file < toSq.file) {
                    // short castling
                    const rookSq = this.getSquare('h', fromSq.rank);
                    if (rookSq.piece) {
                        const rook = rookSq.liftPiece();
                        this.setPieceOn(rook, this.getSquare('f', fromSq.rank));

                        moves.push({
                            from: {file: 'h', rank: fromSq.rank},
                            to: {file: 'f', rank: fromSq.rank},
                            capture: undefined
                        });
                    }
                } else {
                    // long castling
                    const rookSq = this.getSquare('a', fromSq.rank);
                    if (rookSq.piece) {
                        const rook = rookSq.liftPiece();
                        this.setPieceOn(rook, this.getSquare('d', fromSq.rank));

                        moves.push({
                            from: {file: 'a', rank: fromSq.rank},
                            to: {file: 'd', rank: fromSq.rank},
                            capture: undefined
                        });
                    }
                }
            }

            // move piece (including castling king)
            pieceToMove = fromSq.liftPiece();
            this.setPieceOn(pieceToMove, toSq);

        }

        if (fromSq && pieceToMove && moves.length > 0) {
            if (!pieceToMove.hasMoved) {
                // set the has moved flag on the piece
                pieceToMove.hasMoved = true;
                // add a cleanup callback for reversing the state of the piece
                moves[0].reverse = () => (pieceToMove as Piece).hasMoved = false
            }

            // clear and set new en passant state
            this.enPassantState = this.getEnPassantState(fromSq, toSq, pieceToMove);
        }

        return moves;
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
    private capturePiece(square: Square): capture | undefined {

        // lift piece to be taken
        const capturedPiece = square.liftPiece();

        // add captured piece to current players stash
        // TODO

        if (capturedPiece) {
            return {
                piece: capturedPiece,
                coord: square.getCoordinates()
            };
        }

    }

    /**
     * Captures piece as defined by the en passant state
     */
    private capturePieceByEnPassant(): capture | undefined {
        if (this.enPassantState?.pieceSquare) {

            // lift piece to be taken
            const sq = this.getSquare(this.enPassantState.pieceSquare.file, this.enPassantState.pieceSquare.rank);
            const capturedPice = sq.liftPiece();

            if (capturedPice) {

                // add captured piece to current players stash
                // TODO

                return {
                    piece: capturedPice,
                    coord: sq.getCoordinates()
                };
            }

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
