import { useDrop } from 'react-dnd';
import { DraggablePiece } from './DraggablePiece';
import { BoardState } from './board-state';
import { file, rank } from './types';
import { Square } from './square';

interface SquareProps {
    board: BoardState;
    file: file;
    rank: rank;
    setBoard: (board: BoardState) => void;
}

export const SquareEl = ({ board, file, rank, setBoard }: SquareProps) => {
    const square: Square = board.getSquare(file, rank);
    const sqColor = square.getColor();
    const isActive = board.isActiveSq(file, rank);
    const isAvailable = board.isAvailableSquare(file, rank);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'piece', // TODO: reference to DraggablePiece.type
        drop: () => setBoard(board.movePieceTo({file, rank})),
        collect: monitor => ({ isOver: !!monitor.isOver() })
    }), []);

    const squareClicked = (file: file, rank: rank) => {
        // set active piece if they've clicked their own piece and it's their turn
        if (board.isOwnPiece(file, rank) && !board.isActiveSq(file, rank)) {
            setBoard(board.setActiveSquare(file, rank));
        }
        // clear the active square if it's active and they've clicked it again
        else if (board.hasActiveSq() && board.isActiveSq(file, rank)) {
            setBoard(board.clearActiveSq());
        }
        // move the piece if there's an active piece and they havn't clicked their own piece
        else if (board.hasActiveSq() && !board.isOwnPiece(file, rank)) {
            setBoard(board.movePieceTo({file, rank}));
        }
    }

    return (
        <div
            ref={drop}
            className={`square ${sqColor} ${isActive && 'active'} ${isOver && 'is-over'}`}
            onClick={() => squareClicked(file, rank)}
        >
            {
                rank === 1 &&
                <div className="label file-label">{file}</div>
            }
            {
                file === 'a' &&
                <div className="label rank-label">{rank}</div>
            }
            {
                isAvailable && !square.piece &&
                <div className="available-indicator"></div>
            }
            {
                square.piece &&
                <DraggablePiece board={board} piece={square.piece} file={file} rank={rank} setBoard={setBoard} />
            }
            {
                square.piece && isAvailable &&
                <div className="capture-indicator"></div>
            }
        </div>
    );
}
