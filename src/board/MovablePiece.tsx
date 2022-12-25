import classNames from 'classnames';
import './MovablePiece.css';
import { DraggablePiece } from './DraggablePiece';
import { coord, file, pieceColor, pieceType, rank } from './types';
import { PAWN } from './utils/piece-utils';
import PromotionSelect, { promotionType } from './PromotionSelect';
import { usePlayerTurnIfSide, useSquareFromPieceId } from '../app/boardStateSlice';
import { SquareState } from './utils/square-utils';
import { useSelector } from 'react-redux';
import { MutableRefObject, useRef } from 'react';
import { useDrop } from 'react-dnd';

export type OnPromotionCallback = (selection: promotionType, coord: coord) => void;

type MovablePieceData = {
    pieceId: string;
    side: pieceColor | undefined;
    onClick: (file: file, rank: rank) => void;
    onDragStart: (file: file, rank: rank) => void;
    onDrop: (file: file, rank: rank) => void;
    onPromotion: OnPromotionCallback;
};

const useAnimate = (square: SquareState | undefined) => {
    const oldSquare: MutableRefObject<SquareState | null> = useRef(null);
    const oldAnimate: MutableRefObject<boolean> = useRef(false);
    return useSelector((state: any) => {
        if (square && square !== oldSquare.current) {
            oldSquare.current = square;
            oldAnimate.current = state.animation.animate;
            return state.animation.animate;
        } else {
            return oldAnimate.current;
        }
    });
};

export const MovablePiece = ( { pieceId, side, onClick, onDragStart, onDrop, onPromotion }: MovablePieceData) => {

    const square = useSquareFromPieceId(pieceId);
    const animate = useAnimate(square);
    const playersTurn: pieceColor = usePlayerTurnIfSide(side);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'piece',
        drop: () => {
            if (square) {
                onDrop(square.file, square.rank)
            }
        },
        collect: monitor => ({ isOver: !!monitor.isOver() })
    }), [onDrop, square]);

    if (!square || !square.piece) {
        return <></>;
    }

    const coord = { file: square.file, rank: square.rank };
    const piece = square.piece;

    const allowPromotionWindow = !side || side === playersTurn;

    const whitePromotion = allowPromotionWindow && piece?.type === PAWN && coord.rank === 8;
    const blackPromotion = allowPromotionWindow && piece?.type === PAWN && coord.rank === 1;

    const promotion = whitePromotion || blackPromotion;

    const gridPieceClassNames: string = classNames(
        `grid-piece`,
        `_${coord.rank}`,
        coord.file,
        {
            'animate': animate && !promotion,
            'grabbing': isOver
        }
    );

    return (
        <div ref={drop} className={gridPieceClassNames}>
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
                    />
                </div>
            }

        </div>
    )
}
