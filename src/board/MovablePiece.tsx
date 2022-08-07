import { useSelector } from 'react-redux';
import { DraggablePiece } from './DraggablePiece';
import { coord, file, pieceType, rank } from './types';
import { useDrop } from 'react-dnd';
import { BoardState } from './utils/board-utils';
import { isActiveSq } from './utils/board-utils';
import { Piece, PAWN } from './utils/piece-utils';
import './MovablePiece.css';
import PromotionSelect, { promotionType } from './PromotionSelect';

export type OnPromotionCallback = (selection: promotionType, coord: coord | null) => void;

type MovablePieceData = {
    piece: Piece;
    onClick: (file: file, rank: rank) => void;
    onDragStart: (file: file, rank: rank) => void;
    onCapture: (pieceID: string) => void;
    animate: boolean;
    boardState: BoardState;
    onPromotion: OnPromotionCallback;
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
                <PromotionSelect color={'white'} onClick={(type: pieceType | 'cancel') => onPromotion(type, coord)}/>
            }

            {
                blackPromotion &&
                <PromotionSelect color={'black'} onClick={(type: pieceType | 'cancel') => onPromotion(type, coord)}/>
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
