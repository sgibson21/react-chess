import '../board/Board.css';
import { useDispatch } from 'react-redux';
import { move } from './utils/board-utils';
import { Board, BoardOptions } from './Board';
import useHistory from './hooks/useHistory';
import { BACK, FORWARD, PLAY_MOVES } from '../app/boardStateSlice';
import { SET_ANIMATION } from '../app/animationSlice';

type BoardProps = {
    options: BoardOptions;
};

export const LocalBoard = ({options}: BoardProps) => {

    const dispatch = useDispatch();

    useHistory(() => {
        if (!options.side) {
            dispatch(SET_ANIMATION(true));
            dispatch(BACK());
        }
    }, () => {
        if (!options.side) {
            dispatch(SET_ANIMATION(true));
            dispatch(FORWARD());
        }
    });

    const makeMoves = (moves: move[]) => {
        // local game just plays the moves - we dont need to send anything
        dispatch(PLAY_MOVES(moves));
    }

    return (
        <Board dispatchMoves={makeMoves} options={options} />
    );

}
