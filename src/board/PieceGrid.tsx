import { LocatedPiece } from './board-utils';
import { file, rank } from './types';
import { MovablePiece, OnPromotionCallback } from './MovablePiece';
import { BoardInternalState } from './board-utils';

interface PieceGridProps {
    locations: LocatedPiece[];
    onClick: (file: file, rank: rank) => void;
    onDragStart: (file: file, rank: rank) => void;
    onCapture: (pieceID: string) => void;
    animate: boolean;
    boardState: BoardInternalState;
    onPromotion: OnPromotionCallback;
}

export const PieceGrid = ({ locations, onClick, onDragStart, onCapture, animate, boardState, onPromotion }: PieceGridProps) => {

    return (
        <div className='piece-grid'>
            {
                locations.map(location => {
                    return (
                        <MovablePiece
                            key={location.piece.id}
                            piece={location.piece}
                            onClick={onClick}
                            onDragStart={onDragStart}
                            onCapture={onCapture}
                            animate={animate}
                            boardState={boardState}
                            onPromotion={onPromotion}
                        ></MovablePiece>
                    )
                })
            }
        </div>
    );
};
