export type file = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

export type rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type pieceColor = 'white' | 'black';

export type squareColor = 'light' | 'dark';

export type pieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export type piecePoints = 9 | 5 | 3 | 1;

export type square = {
    file: file;
    rank: rank;
};

export type enPassantState = {
    /**
     * square that the pawn to be captured moved to
     */
    pieceSquare: square;

    /**
     * square that the pawn to be captured skipped, on it's first move
     */
    captureSquare: square;
};
