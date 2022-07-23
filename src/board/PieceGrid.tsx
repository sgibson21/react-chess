import { LocatedPiece } from './Board';
import { file, rank } from './types';
import './PieceGrid.css';
import { MovablePiece } from './MovablePiece';

interface PieceGridProps {
    locations: LocatedPiece[];
    onClick: (file: file, rank: rank) => void;
    onDragStart: (file: file, rank: rank) => void;
}

export const PieceGrid = ({locations, onClick, onDragStart}: PieceGridProps) => {

    // console.log('piece grid', locations)

    return (
        <div className='piece-grid'>
            {
                locations.map(location => {
                    return (
                        <MovablePiece
                            key={location.piece.id}
                            piece={location.piece}
                            onClick={(file, rank) => onClick(file, rank)}
                            onDragStart={(file, rank) => onDragStart(file, rank)}
                        ></MovablePiece>
                    )
                })
            }
        </div>
    );
};
