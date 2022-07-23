import { useDrop } from 'react-dnd';
import { DraggablePiece } from './DraggablePiece';
import { file, rank } from './types';
import { getColor, Square } from './square';
import { BoardInternalState } from './board-state';

interface SquareProps {
    square: Square;
    onSquareClick: (file: file, rank: rank) => void;
    onDragStart: (file: file, rank: rank) => void;
    isActive: boolean;
    isAvailable: boolean;
    onDrop: (file: file, rank: rank) => void;
}

export const SquareEl = ({ square, onSquareClick, onDragStart, isActive, isAvailable, onDrop }: SquareProps) => {

    const { file, rank } = square;
    const sqColor = getColor(square);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'piece', // TODO: reference to DraggablePiece.type
        drop: () => onDrop(file, rank),
        collect: monitor => ({ isOver: !!monitor.isOver() })
    }), []);

    // console.log('sq el...');

    return (
        <div
            ref={drop}
            className={`square ${sqColor} ${isActive && 'active'} ${isOver && 'is-over'}`}
            onClick={() => onSquareClick(file, rank)}
            onDragStart={() => onDragStart(file, rank)}
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
                <DraggablePiece piece={square.piece} file={file} rank={rank} onDragStart={onDragStart}/>
            }
            {
                square.piece && isAvailable &&
                <div className="capture-indicator"></div>
            }
        </div>
    );
}
