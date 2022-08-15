import classNames from 'classnames';
import { useDrop } from 'react-dnd';
import { getColor, SquareState } from './utils/square-utils';

interface SquareProps {
    square: SquareState;
    isActive: boolean;
    isAvailable: boolean;
    firstFile: boolean;
    bottomRank: boolean;
    onClick: () => void;
    onDrop: () => void;
}

export const Square = ({ square, isActive, isAvailable, firstFile, bottomRank, onClick, onDrop }: SquareProps) => {

    const { file, rank } = square;
    const sqColor = getColor(square);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'piece',
        drop: () => onDrop(),
        collect: monitor => ({ isOver: !!monitor.isOver() })
    }), [onDrop]);

    const squareClassNames: string = classNames(
        'square',
        sqColor,
        {
            'active': isActive,
            'is-over': isOver,
            'grabbing': isOver
        }
    );

    return (
        <div
            ref={drop}
            className={squareClassNames}
            onClick={() => onClick()}
        >
            {
                bottomRank &&
                <div className="label file-label">{file}</div>
            }
            {
                firstFile &&
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
