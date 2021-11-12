import { BoardState, files, ranks } from '../board/board-state';
import { Square } from '../board/Square';
import { pieceType, file, rank, square } from '../board/types';

export class PieceNavigator {
    
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
            return this.navigatorMap[piece.type](boardState, square);
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

        // TODO: en passant

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
            const sq = this.getSquareFrom(squareFrom.file, coord.file, squareFrom.rank, coord.rank);
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
        return [];
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
        const coords = fileDirections.map(fileDir => this.getSquareFrom(from.file, fileDir, from.rank, direction)).filter(x => !!x);
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

    private getBishopPath(boardState: BoardState, from: Square, fileDirection: 1 | -1, rankDirection: 1 | -1): Square[] {
        const path: Square[] = [];

        // describes if...
        let openPath: boolean;
        let count = 0;

        do {
            openPath = false;
            count++;

            const coords = this.getSquareFrom(from.file, fileDirection * count, from.rank, rankDirection * count);
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

            const coords = isRankPath ? this.getSquareFrom(from.file, 0, from.rank, direction * count) :
                this.getSquareFrom(from.file, direction * count, from.rank, 0);
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
     * Gets the square { file, rank } of the square [fileCount] and [rankCount] away from the given square
     */
    private getSquareFrom(fromFile: file, fileCount: number, fromRank: rank, rankCount: number): square | undefined {
        const file = this.getFileFrom(fromFile, fileCount);
        const rank = this.getRankFrom(fromRank, rankCount);
        if (file && rank) {
            return { file, rank };
        }
    }

    /**
     * Gets the file that is [count] many files from the file provided
     * @param file 
     * @param count 
     * @returns 
     */
    private getFileFrom(file: file, count: number): file {
        const fileIndex = files.indexOf(file);
        return files[fileIndex + count];
    }

    /**
     * Gets the rank that is [count] many ranks from the rank provided
     * @param rank 
     * @param count 
     * @returns 
     */
    private getRankFrom(rank: rank, count: number): rank {
        const rankIndex = ranks.indexOf(rank);
        return ranks[rankIndex + count];
    }

}
