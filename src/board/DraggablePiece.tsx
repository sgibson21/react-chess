import { DragPreviewImage, useDrag } from 'react-dnd'
import { Piece } from '../pieces/piece';
import { BoardState } from './board-state';
import { file, rank } from './types';
import { getEmptyImage } from 'react-dnd-html5-backend';

interface DraggablePieceProps {
    board: BoardState;
    piece: Piece;
    file: file;
    rank: rank;
    setBoard: (board: BoardState) => void;
}

export const DraggablePiece = ({ board, piece, file, rank, setBoard }: DraggablePieceProps) => {
    const [{ isDragging }, drag, preview] = useDrag(() => {
        return {
            type: 'piece', // TODO: does this need to be more specific?
            item: () => {
                // This is the function run at the begining of a drag
                if (board.isOwnPiece(file, rank)) {
                    setBoard(board.setActiveSquare(file, rank));
                }
                // always returning the piece allows you to drag any piece, but only your own pieces can be set as the active square
                return { file, rank };
            },
            collect: monitor => ({ isDragging: !!monitor.isDragging() })
        };
    }, []);

    return (
        <>
            <DragPreviewImage connect={preview} src={getEmptyImage().src} />
            <div ref={drag} style={{  visibility: isDragging ? 'hidden' : 'visible' }}>
                <div className={`piece ${piece.imgClass}`}></div>
            </div>
        </>
    )
}
