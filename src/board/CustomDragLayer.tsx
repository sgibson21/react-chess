import { CSSProperties } from 'react';
import { useDragLayer, XYCoord } from 'react-dnd';
import { Square } from './square';

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

export const CustomDragLayer = ({ activeSquare }: { activeSquare: Square | null }) => {

    const { item, isDragging, currentOffset } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        currentOffset:  monitor.getClientOffset(),
        isDragging: monitor.isDragging(),
    }));

    if (!activeSquare || !item) {
        return null;
    }

    if (activeSquare.file !== item.file || activeSquare.rank !== item.rank) {
        return null;
    }

    if (!isDragging) {
        return null;
    }

    return (
        <div style={layerStyles}>
            <div style={getItemStyles(currentOffset)}>
                <div className={`piece ${activeSquare.piece?.imgClass}`}></div>
            </div>
        </div>
    );
}
