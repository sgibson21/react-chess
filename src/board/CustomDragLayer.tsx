import { CSSProperties } from 'react';
import { useDragLayer, XYCoord } from 'react-dnd';
import { BoardState } from './board-state';

interface CustomDragLayerProps {
    board: BoardState;
}

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

export const CustomDragLayer = ({ board }: CustomDragLayerProps) => {

    const { item, isDragging, currentOffset } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        currentOffset:  monitor.getClientOffset(),
        isDragging: monitor.isDragging(),
    }));

    if (!isDragging) {
        return null;
    }

    const piece = board.getSquare(item.file, item.rank).piece;

    return (
        <div style={layerStyles}>
            <div style={getItemStyles(currentOffset)}>
                <div className={`piece ${piece?.imgClass}`}></div>
            </div>
        </div>
    );
}
