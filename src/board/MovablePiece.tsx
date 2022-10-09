import { useSelector } from 'react-redux';
import { DraggablePiece } from './DraggablePiece';
import { coord, file, pieceColor, pieceType, rank } from './types';
import { useDragLayer, useDrop } from 'react-dnd';
import { BoardState } from './utils/board-utils';
import { isActiveSq } from './utils/board-utils';
import { Piece, PAWN } from './utils/piece-utils';
import './MovablePiece.css';
import PromotionSelect, { promotionType } from './PromotionSelect';
import classNames from 'classnames';

export type OnPromotionCallback = (selection: promotionType, coord: coord) => void;

type MovablePieceData = {
    piece: Piece;
    boardState: BoardState;
    side: pieceColor | undefined;
    animate: boolean;
    onClick: (file: file, rank: rank) => void;
    onDragStart: (file: file, rank: rank) => void;
    onPromotion: OnPromotionCallback;
};

export const MovablePiece = ( {piece, boardState, side, animate, onClick, onDragStart, onPromotion }: MovablePieceData) => {
    
    const coord: coord | undefined = useSelector((state: any) => {
        return state.pieceLocation[piece.id];
    });

    const { isDragging } = useDragLayer(monitor => ({
        isDragging: monitor.isDragging()
    }));

    if (!coord) {
        return <></>;
    }

    /**
     * don't show the promotion window if it's not the current side's turn
     * 
     * TODO: ideally this info isnt sent over the socket but will do for now
     *       This could be refactored into a util method, eg: showPreMoveOptions
     */
    const allowPromotionWindow = !side || side === boardState.playersTurn;

    const whitePromotion = allowPromotionWindow && piece.type === PAWN && coord.rank === 8;
    const blackPromotion = allowPromotionWindow && piece.type === PAWN && coord.rank === 1;

    const promotion = whitePromotion || blackPromotion;

    const gridPieceClassNames: string = classNames(
        `grid-piece`,
        `_${coord.rank}`,
        coord.file,
        {
            'animate': animate && !promotion,
            'grabbing': isDragging,
            'grab': !isDragging,
            'stop-pointer-events': isDragging
        }
    );

    return (
        <div className={gridPieceClassNames}>
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
                <div onClick={() => onClick(coord.file, coord.rank)}>
                    <DraggablePiece
                        piece={piece}
                        file={coord.file}
                        rank={coord.rank}
                        onDragStart={onDragStart}
                        isActive={isActiveSq(coord.file, coord.rank, boardState)}
                    />
                </div>
            }

        </div>
    )
}
