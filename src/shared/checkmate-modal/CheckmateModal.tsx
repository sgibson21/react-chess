import { useDispatch } from 'react-redux';
import { useWinner } from '../../app/boardStateSlice';
import { SET_GAME_OVER_WINDOW_CLOSED, useGameOverWindowClosed } from '../../app/settingsSlice';
import './CheckmateModal.css';

type CheckmateModalProps = {
    onNewGame: () => void,
    onMainMenu: () => void
}

export const CheckmateModal = ({ onNewGame, onMainMenu }: CheckmateModalProps) => {
    const winner = useWinner();
    const closed = useGameOverWindowClosed();
    const dispatch = useDispatch();

    if (closed || !winner) {
        return <></>;
    }

    const handleClose = () => {
        dispatch(SET_GAME_OVER_WINDOW_CLOSED(true));
    };

    return (
        <div className='checkmate-modal'>
            <div className='close-modal' onClick={handleClose}>X</div>
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
