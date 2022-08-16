import { pieceColor, pieceType } from './types';

export type promotionType = pieceType | 'cancel';

export default function PromotionSelect({ color, onClick }: { color: pieceColor, onClick: (type: promotionType) => void }) {
    const classColor = color === 'white' ? 'w' : 'b';
    const closeIconWidth = window.innerWidth <= 400 ? 16 : 32;
    return (
        <div className={`promotion-select ps-${color}`}>
            <div className={`piece ${classColor}q`} onClick={() => onClick('queen')}></div>
            <div className={`piece ${classColor}n`} onClick={() => onClick('knight')}></div>
            <div className={`piece ${classColor}r`} onClick={() => onClick('rook')}></div>
            <div className={`piece ${classColor}b`} onClick={() => onClick('bishop')}></div>
            <div className='close' onClick={e => onClick('cancel')}>
                <svg xmlns="http://www.w3.org/2000/svg" width={closeIconWidth} height={closeIconWidth} fill="currentColor" className="close-icon" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
            </div>
        </div>
    );
}
