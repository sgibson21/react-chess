import { CSSProperties, useRef } from 'react';
import { useDragLayer, XYCoord } from 'react-dnd';
import { SquareState } from './utils/square-utils';

const layerStyles: CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    display: 'inline-block',
    cursor: 'grabbing',
};

function getItemStyles(currentOffset: XYCoord | null, containerRef: any) {
    if (!currentOffset || !containerRef || !containerRef.current) {
      return {
        display: 'none',
      };
    }

    // x and y coords of the mouse relative to the whole page
    const { x, y } = currentOffset;

    // the CustomDragLayer is inside the board element, which does not start at (0,0) relative to the whole page
    // so we subtract the {x,y} of the top left of the CustomDragLayer from the offset we are given from the dragDrop monitor
    const { x: containerX, y: containerY } = containerRef.current.getBoundingClientRect();

    // take another 50px off each coord to center the piece in the square
    const transform = `translate(${x - containerX - 50}px, ${y - containerY - 50}px)`
    return {
      transform,
      WebkitTransform: transform,
    }
  }

export const CustomDragLayer = ({ activeSquare }: { activeSquare: SquareState | null }) => {

    const { item, isDragging, currentOffset } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        currentOffset:  monitor.getClientOffset(),
        isDragging: monitor.isDragging(),
    }));

    const containerRef = useRef<HTMLDivElement | null>(null);

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
        <div ref={containerRef} style={layerStyles}>
            <div style={getItemStyles(currentOffset, containerRef)}>
                <div className={`piece ${activeSquare.piece?.imgClass}`}></div>
            </div>
        </div>
    );
}
