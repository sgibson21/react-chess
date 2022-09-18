import { pieceColor } from '../../board/types';
import './CheckmateModal.css';

type CheckmateModalProps = {
    winner: pieceColor,
    onClose: () => void,
    onNewGame: () => void,
    onMainMenu: () => void
}

export const CheckmateModal = ({ winner, onClose, onNewGame, onMainMenu }: CheckmateModalProps) => {
    return (
        <div className='checkmate-modal'>
            <div className='close-modal' onClick={onClose}>X</div>
            <div className='modal-body'>
                <h2>{winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!</h2>
                <div className='options'>
                    <button onClick={() => onNewGame()}>New Game</button>
                    <button onClick={() => onMainMenu()}>Main Menu</button>
                </div>
            </div>
        </div>
    );
}
