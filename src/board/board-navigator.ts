import { BoardState } from './board-state';
import { Square } from './square';
import { pieceType, file, rank, coord, direction } from './types';
import { getFileFrom, getRankFrom, getSquareFrom } from './utils';

export class BoardNavigator {
    
    private navigatorMap: Record<pieceType, (boardState: BoardState, fromSquare: Square) => Square[]> = {
        pawn: (boardState: BoardState, fromSquare: Square) => this.pawnMovement(boardState, fromSquare),
        knight: (boardState: BoardState, fromSquare: Square) => this.knightMovement(boardState, fromSquare),
        bishop: (boardState: BoardState, fromSquare: Square) => this.bishopMovement(boardState, fromSquare),
        rook: (boardState: BoardState, fromSquare: Square) => this.rookMovement(boardState, fromSquare),
        queen: (boardState: BoardState, fromSquare: Square) => this.queenMovement(boardState, fromSquare),
        king: (boardState: BoardState, fromSquare: Square) => this.kingMovement(boardState, fromSquare)
    };

    public getPieceMovement(boardState: BoardState, square: Square): Square[] {
        const piece = square.piece;

        if (piece) {
            return this.navigatorMap[piece.type](boardState, square)
                .filter(toSq => {
                    const move = {from: square.getCoordinates(), to: toSq.getCoordinates()};
                    return !boardState.simulateMove(move, sim => sim.isInCheck());
                });
        }

        return [];
    }

    private pawnMovement(boardState: BoardState, fromSquare: Square): Square[] {
        const movements: Square[] = [];

        // gets the direction the piece moves, based on piece color
        const direction = boardState.getPlayingDirection();

        let distanceAllowed: number = 0;
        if ((direction > 0 && fromSquare.rank < 8) || (direction < 0 && fromSquare.rank > 1)) {
            distanceAllowed++;
        }

        // can move 2 spaces forward if it's the first pawn movement (ie, it's on the 2nd rank)
        if ((direction > 0 && fromSquare.rank === 2) || (direction < 0 && fromSquare.rank === 7)) {
            distanceAllowed++;
        }

        // moving forward (including 2 squares on first movement)
        movements.push(...this.getPawnPath(boardState, fromSquare, direction, distanceAllowed));

        // captures
        movements.push(...this.getPawnCaptures(boardState, fromSquare, direction));

        // en passant
        movements.push(...this.getEnPassant(boardState, fromSquare));

        // TODO: queening
        
        return movements;
    }

    private knightMovement(boardState: BoardState, squareFrom: Square): Square[] {
        const movements: Square[] = [];

        const coords = [
            { file: 1, rank: 2},
            { file: 2, rank: 1},
            { file: 2, rank: -1},
            { file: 1, rank: -2},
            { file: -1, rank: -2},
            { file: -2, rank: -1},
            { file: -2, rank: 1},
            { file: -1, rank: 2}
        ];

        coords.forEach(coord => {
            const sq = getSquareFrom(squareFrom.file, coord.file, squareFrom.rank, coord.rank);
            if (sq) {
                const squareTo = boardState.getSquare(sq.file, sq.rank);
                if (!squareTo.piece || squareTo.piece.color !== squareFrom.piece?.color) {
                    movements.push(squareTo);
                }
            }
        });

        return movements;
    }

    private bishopMovement(boardState: BoardState, square: Square): Square[] {
        return [
            ...this.getBishopPath(boardState, square, 1, 1),
            ...this.getBishopPath(boardState, square, -1, 1),
            ...this.getBishopPath(boardState, square, 1, -1),
            ...this.getBishopPath(boardState, square, -1, -1),
        ];
    }

    private rookMovement(boardState: BoardState, square: Square): Square[] {
        return [
            ...this.getRookPath(boardState, square, 1),
            ...this.getRookPath(boardState, square, -1),
            ...this.getRookPath(boardState, square, 1, true),
            ...this.getRookPath(boardState, square, -1, true),
        ];
    }

    private queenMovement(boardState: BoardState, square: Square): Square[] {
        return [
            ...this.bishopMovement(boardState, square),
            ...this.rookMovement(boardState, square),
        ];
    }

    private kingMovement(boardState: BoardState, square: Square): Square[] {
        const movements: Square[] = [];
        const coords: direction[] = [
            { file: -1, rank: 1},
            { file: 0, rank: 1},
            { file: 1, rank: 1},
            { file: -1, rank: 0},
            { file: 1, rank: 0},
            { file: -1, rank: -1},
            { file: 0, rank: -1},
            { file: 1, rank: -1}
        ];
        
        coords.forEach(coord => {
            const sq = getSquareFrom(square.file, coord.file, square.rank, coord.rank);
            if (sq) {
                const squareTo = boardState.getSquare(sq.file, sq.rank);
                if (!squareTo.piece || squareTo.piece.color !== square.piece?.color) {
                    movements.push(squareTo);
                }
            }
        });

        // castling - king hasnt moved, path to rook is clear and not in line of sight of attacking piece, rook hasnt moved
        if (square.piece && !square.piece.hasMoved) {
            // short castling is always towards the h file, long towards the a file
            const pathToRookShort = this.getRookPath(boardState, square, 1, false);
            const pathToRookLong = this.getRookPath(boardState, square, -1, false);

            const rookAtShortCoord = getSquareFrom(square.file, 3, square.rank, 0);
            const rookAtLongCoord = getSquareFrom(square.file, -4, square.rank, 0);
            
            if (rookAtShortCoord) {
                const rookAtShortSq = boardState.getSquare(rookAtShortCoord.file, rookAtShortCoord.rank);

                if (pathToRookShort.length === 2 && rookAtShortSq.piece && !rookAtShortSq.piece?.hasMoved) {

                    // path to king's final position should not be in the line of sight of an attacking piece
                    const pathInCheck: boolean = boardState.simulateMove({
                        from: {file: square.file, rank: square.rank},
                        to: {file: pathToRookShort[0].file, rank: pathToRookShort[0].rank}
                    }, sim => sim.isInCheck());

                    if (!pathInCheck) {
                        movements.push(pathToRookShort[1]);
                    }
                }
            }

            if (rookAtLongCoord) {
                const rookAtLongSq = boardState.getSquare(rookAtLongCoord.file, rookAtLongCoord.rank);

                if (pathToRookLong.length === 3 && rookAtLongSq.piece && !rookAtLongSq.piece.hasMoved) {

                    // path to king's final position should not be in the line of sight of an attacking piece
                    const pathInCheck: boolean = boardState.simulateMove({
                        from: {file: square.file, rank: square.rank},
                        to: {file: pathToRookShort[0].file, rank: pathToRookShort[0].rank}
                    }, sim => sim.isInCheck());

                    if (!pathInCheck) {
                        movements.push(pathToRookLong[1]);
                    }
                }
            }

        }

        return movements;
    }

    /**
     * Gets the path for the forward movement up a rank, until a piece is in the way.
     * 
     * That path does NOT include the piece
     */
    private getPawnPath(boardState: BoardState, from: Square, direction: 1 | -1, distance: number): Square[] {
        const path = [];
        for (let i = 1; i <= distance; i++) {
            const square = boardState.getSquare(from.file, from.rank + (direction * i) as rank);
            if (!square.piece) {
                path.push(square);
            } else {
                break;
            }
        }
        return path;
    }

    private getPawnCaptures(boardState: BoardState, from: Square, direction: 1 | -1): Square[] {
        const captures: Square[] = [];
        const fileDirections = [1, -1];
        const coords = fileDirections.map(fileDir => getSquareFrom(from.file, fileDir, from.rank, direction)).filter(x => !!x);
        coords.forEach(coord => {
            if (coord) {
                const captureSq = boardState.getSquare(coord.file, coord.rank);
                if (captureSq.piece && captureSq.piece.color !== from.piece?.color) {
                    captures.push(captureSq);
                }
            }
        })
        return captures;
    }

    private getEnPassant(boardState: BoardState, fromSquare: Square): Square[] {
        const movements: Square[] = [];

        const enPassantCaptureSq = boardState.getEnPassantCaptureSq();
        const enPassantPieceSq = boardState.getEnPassantPieceSq();

        // if the capturing piece is on the same rank as the en passant piece square
        if (enPassantCaptureSq && enPassantPieceSq && fromSquare.rank === enPassantPieceSq.rank) {

            const fileLeft = getFileFrom(fromSquare.file, -1);
            const fileRight = getFileFrom(fromSquare.file, 1);

            // AND the capturing piece is either on the file to the left OR right of the en passant capture square
            if (enPassantPieceSq.file === fileLeft || enPassantPieceSq.file === fileRight) {
                movements.push(boardState.getSquare(enPassantCaptureSq.file, enPassantCaptureSq.rank));
            }
        }

        return movements;
    }

    private getBishopPath(boardState: BoardState, from: Square, fileDirection: 1 | -1, rankDirection: 1 | -1): Square[] {
        const path: Square[] = [];

        // describes if no pieces are blocking the path up to this point
        let openPath: boolean;
        let count = 0;

        do {
            openPath = false;
            count++;

            const coords = getSquareFrom(from.file, fileDirection * count, from.rank, rankDirection * count);
            if (coords) {
                const sq = boardState.getSquare(coords.file, coords.rank);

                // If there's no piece, continue on the path
                if (!sq.piece) {
                    openPath = true;
                }

                // add to the path if there's no piece or it's not the player's own piece
                if (!sq.piece || sq.piece.color !== from.piece?.color) {
                    path.push(sq);
                }
            }

        } while (openPath)

        return path;
    }

    /**
     * Gets a path for a Rook
     * @param isRankPath Is it a path along a rank?
     * @returns 
     */
    private getRookPath(boardState: BoardState, from: Square, direction: 1 | -1, isRankPath = false): Square[] {
        const path: Square[] = [];

        // describes if...
        let openPath: boolean;
        let count = 0;

        do {
            openPath = false;
            count++;

            const coords = isRankPath ? getSquareFrom(from.file, 0, from.rank, direction * count) :
                getSquareFrom(from.file, direction * count, from.rank, 0);
            if (coords) {
                const sq = boardState.getSquare(coords.file, coords.rank);

                // If there's no piece, continue on the path
                if (!sq.piece) {
                    openPath = true;
                }

                // add to the path if there's no piece or it's not the player's own piece
                if (!sq.piece || sq.piece.color !== from.piece?.color) {
                    path.push(sq);
                }
            }

        } while (openPath)

        return path;
    }

}
