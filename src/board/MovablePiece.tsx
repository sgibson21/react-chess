import { Piece } from '../pieces/piece';
import { useSelector } from 'react-redux';
import { DraggablePiece } from './DraggablePiece';
import { file, rank } from './types';
import { useDrop } from 'react-dnd';
import { BoardInternalState } from './board-utils';
import { isActiveSq } from './board-utils';

type MovablePieceData = {
    piece: Piece;
    onClick: (file: file, rank: rank) => void;
    onDragStart: (file: file, rank: rank) => void;
    onCapture: (pieceID: string) => void;
    animate: boolean;
    boardState: BoardInternalState;
};

export const MovablePiece = ( {piece, onClick, onDragStart, onCapture, animate, boardState }: MovablePieceData) => {
    
    const coord = useSelector((state: any) => {
        return state.pieceLocation[piece.id];
    });

    const [ _, drop ] = useDrop(() => ({
        accept: 'piece',
        drop: () => onCapture(piece.id),
    }), [piece, onCapture, boardState]); // remember to add all dependencies

    return (
        <div
            ref={drop}
            className={`grid-piece ${coord?.file} _${coord?.rank} ${ animate ? 'animate' : '' }`}
            onClick={() => onClick(coord?.file, coord?.rank)}
        >
            <DraggablePiece
                piece={piece}
                file={coord?.file}
                rank={coord?.rank}
                onDragStart={onDragStart}
                isActive={isActiveSq(coord?.file, coord?.rank, boardState)}
            />
        </div>
    )
}
