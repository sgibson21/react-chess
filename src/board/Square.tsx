import classNames from 'classnames';
import { useDrop } from 'react-dnd';
import { useIsActiveSquare, useIsAvailableSquare, useSquare } from '../app/boardStateSlice';
import { file, rank } from './types';
import { getColor, SquareState } from './utils/square-utils';

interface SquareProps {
    file: file;
    rank: rank;
    showFileLabel: boolean;
    showRankLabel: boolean;
    onClick: () => void;
    onDrop: () => void;
}

export const Square = (props: SquareProps) => {

    const { file, rank, showFileLabel, showRankLabel, onClick, onDrop } = props;
    const coord = { file, rank };

    const square: SquareState = useSquare(coord);
    const isActive = useIsActiveSquare(coord);
    const isAvailable = useIsAvailableSquare(coord);

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
            'grabbing': isOver,
        }
    );

    return (
        <div
            ref={drop}
            className={squareClassNames}
            onClick={() => onClick()}
        >
            {
                showRankLabel &&
                <div className="label file-label">{file}</div>
            }
            {
                showFileLabel &&
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
