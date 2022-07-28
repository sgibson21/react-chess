import { Piece } from '../pieces/piece';
import { useSelector } from 'react-redux';
import { DraggablePiece } from './DraggablePiece';
import { coord, file, pieceType, rank } from './types';
import { useDrop } from 'react-dnd';
import { BoardInternalState } from './board-utils';
import { isActiveSq } from './board-utils';
import { PAWN } from '../pieces/pieces';
import './MovablePiece.css';

type MovablePieceData = {
    piece: Piece;
    onClick: (file: file, rank: rank) => void;
    onDragStart: (file: file, rank: rank) => void;
    onCapture: (pieceID: string) => void;
    animate: boolean;
    boardState: BoardInternalState;
    onPromotion: (selection: pieceType | 'cancel', coord: coord | null) => void;
};

export const MovablePiece = ( {piece, onClick, onDragStart, onCapture, animate, boardState, onPromotion }: MovablePieceData) => {
    
    const coord = useSelector((state: any) => {
        return state.pieceLocation[piece.id];
    });

    const [ _, drop ] = useDrop(() => ({
        accept: 'piece',
        drop: () => onCapture(piece.id),
    }), [piece, onCapture, boardState]); // remember to add all dependencies

    const whitePromotion = piece.type === PAWN && coord?.rank === 8;
    const blackPromotion = piece.type === PAWN && coord?.rank === 1;

    const promotion = whitePromotion || blackPromotion;

    return (
        <div
            ref={drop}
            className={`grid-piece ${coord?.file} _${coord?.rank} ${ animate && !promotion ? 'animate' : '' }`}
        >
            {
                whitePromotion &&

                <div className='promotion-select ps-white'>
                    <div className='piece wq' onClick={() => onPromotion('queen', coord)}></div>
                    <div className='piece wn' onClick={() => onPromotion('knight', coord)}></div>
                    <div className='piece wr' onClick={() => onPromotion('rook', coord)}></div>
                    <div className='piece wb' onClick={() => onPromotion('bishop', coord)}></div>
                    <div className='close' onClick={e => onPromotion('cancel', null)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="close-icon" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </div>
                </div>
            }

{
                blackPromotion &&

                <div className='promotion-select ps-black'>
                    <div className='close' onClick={e => onPromotion('cancel', null)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="close-icon" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </div>

                    <div className='piece bb' onClick={() => onPromotion('bishop', coord)}></div>
                    <div className='piece br' onClick={() => onPromotion('rook', coord)}></div>
                    <div className='piece bn' onClick={() => onPromotion('knight', coord)}></div>
                    <div className='piece bq' onClick={() => onPromotion('queen', coord)}></div>
                    
                </div>
            }

            {
                !promotion &&

                <div onClick={() => onClick(coord?.file, coord?.rank)}>
                    <DraggablePiece
                        piece={piece}
                        file={coord?.file}
                        rank={coord?.rank}
                        onDragStart={onDragStart}
                        isActive={isActiveSq(coord?.file, coord?.rank, boardState)}
                    />
                </div>
            }

        </div>
    )
}
