import { Piece } from '../pieces/piece';
import { useSelector, useDispatch } from 'react-redux';
import { DraggablePiece } from './DraggablePiece';
import { file, rank } from './types';

type MovablePieceData = {
    piece: Piece;
    onClick: (file: file, rank: rank) => void;
    onDragStart: (file: file, rank: rank) => void;
};

export const MovablePiece = ( {piece, onClick, onDragStart }: MovablePieceData) => {
    
    const coord = useSelector((state: any) => {
        return state.pieceLocation[piece.id];
    });

    // console.log('movable piece', coord);

    return (
        <div
            className={`grid-piece ${coord?.file} _${coord?.rank}`}
            onClick={() => onClick(coord?.file, coord?.rank)}
            // onDragStart={() => {
            //     console.log('movable piece drag start');
            //     onDragStart(coord?.file, coord?.rank);
            // }}
        >
            <DraggablePiece piece={piece} file={coord?.file} rank={coord?.rank} onDragStart={onDragStart}/>
        </div>
    )
}
