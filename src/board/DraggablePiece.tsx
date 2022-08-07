import { DragPreviewImage, useDrag } from 'react-dnd'
import { Piece } from './utils/piece-utils';
import { file, rank } from './types';
import { getEmptyImage } from 'react-dnd-html5-backend';

interface DraggablePieceProps {
    piece: Piece;
    file: file;
    rank: rank;
    onDragStart: (file: file, rank: rank) => void;
    isActive: boolean;
}

export const DraggablePiece = ({ piece, file, rank, onDragStart, isActive }: DraggablePieceProps) => {
    const [{ isDragging }, drag, preview] = useDrag(() => {
        return {
            type: 'piece',
            item: () => {
                // This is the function run at the begining of a drag
                onDragStart(file, rank);
                // always returning the piece allows you to drag any piece
                // but only your own pieces can be set as the active square
                return { file, rank };
            },
            collect: monitor => ({ isDragging: isActive && !!monitor.isDragging()})
        };
    }, [file, rank, onDragStart, isActive]); // remember that useDrag depends on the dragStart callback

    return (
        <>
            <DragPreviewImage connect={preview} src={getEmptyImage().src} />
            <div ref={drag} style={{  visibility: isDragging ? 'hidden' : 'visible' }}>
                <div className={`piece ${piece.imgClass}`}></div>
            </div>
        </>
    )
}
