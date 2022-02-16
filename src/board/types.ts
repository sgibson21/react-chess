export type file = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

export type rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type pieceColor = 'white' | 'black';

export type squareColor = 'light' | 'dark';

export type pieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export type pieceImgKey = 'bb' | 'bk' | 'bn' | 'bp' | 'bq' | 'br' | 'wb' | 'wk' | 'wn' | 'wp' | 'wq' | 'wr';

export type piecePoints = 9 | 5 | 3 | 1;

/**
 * coordinates of file and rank eg: a1
 */
export type coord = {
    file: file;
    rank: rank;
};

/**
 * represents a direction, in a straight line, relative to a given coordinate
 * 
 * eg: { file: -1, rank: 1 } would describe a North Westerly direction
 */
export type direction = {
    file: -1 | 0 | 1;
    rank: -1 | 0 | 1;
};

/**
 * represents a direction in which a knight can attack a given coordinate from
 */
export type knightDirection =
    { file: 1, rank: 2}   |
    { file: 2, rank: 1}   |
    { file: 2, rank: -1}  |
    { file: 1, rank: -2}  |
    { file: -1, rank: -2} |
    { file: -2, rank: -1} |
    { file: -2, rank: 1}  |
    { file: -1, rank: 2};

export type enPassantState = {
    /**
     * square that the pawn to be captured moved to
     */
    pieceSquare: coord;

    /**
     * square that the pawn to be captured skipped, on it's first move
     */
    captureSquare: coord;
};
