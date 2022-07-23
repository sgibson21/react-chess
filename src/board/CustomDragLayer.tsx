import { CSSProperties } from 'react';
import { useDragLayer, XYCoord } from 'react-dnd';
import { Piece } from '../pieces/piece';
import { BoardInternalState, BoardState } from './board-state';
import { getSquare } from './board-utils';
import { file, rank } from './types';

const layerStyles: CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    display: 'inline-block',
    cursor: 'grabbing',
};

function getItemStyles(currentOffset: XYCoord | null) {
    if (!currentOffset) {
      return {
        display: 'none',
      };
    }
  
    const { x, y } = currentOffset;

    const transform = `translate(${x - 100}px, ${y - 100}px)`
    return {
      transform,
      WebkitTransform: transform,
    }
  }

export const CustomDragLayer = ({ board }: { board: BoardInternalState}) => {

    const { item, isDragging, currentOffset } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        currentOffset:  monitor.getClientOffset(),
        isDragging: monitor.isDragging(),
    }));

    if (!isDragging) {
        return null;
    }

    // console.log('custom drag layer item:', item)
    // TODO: make sure dragable/movable piece is in scop of useDrop

    const piece = getSquare(item.file, item.rank, board).piece;

    return (
        <div style={layerStyles}>
            <div style={getItemStyles(currentOffset)}>
                <div className={`piece ${piece?.imgClass}`}></div>
            </div>
        </div>
    );
}
