import { useDrop } from 'react-dnd';
import { getColor, Square } from './square';

interface SquareProps {
    square: Square;
    isActive: boolean;
    isAvailable: boolean;
    onClick: () => void;
    onDrop: () => void;
}

export const SquareEl = ({ square, isActive, isAvailable, onClick, onDrop }: SquareProps) => {

    const { file, rank } = square;
    const sqColor = getColor(square);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'piece',
        drop: () => onDrop(),
        collect: monitor => ({ isOver: !!monitor.isOver() })
    }), [onDrop]);

    return (
        <div
            ref={drop}
            className={`square ${sqColor} ${isActive && 'active'} ${isOver && 'is-over'}`}
            onClick={() => onClick()}
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
                square.piece && isAvailable &&
                <div className="capture-indicator"></div>
            }
        </div>
    );
}
