import { useState } from 'react';
import '../board/Board.css';
import { BoardState, back, forward, playMoves, move } from '../board/utils/board-utils';
import { Board, BoardOptions, defaultBoardOptions } from '../board/Board';
import useHistory from '../board/hooks/useHistory';

type BoardProps = {
    boardState: BoardState;
    setBoardState: (state: BoardState) => void;
    options?: BoardOptions;
};

export const LocalGame = ({boardState: board, setBoardState, options = defaultBoardOptions}: BoardProps) => {

    const [animate, setAnimate] = useState(true);

    useHistory(board, () => {
        if (!options.side) {
            setAnimate(true);
            setBoardState(back(board));
        }
    }, () => {
        if (!options.side) {
            setAnimate(true);
            setBoardState(forward(board));
        }
    });

    const makeMoves = (moves: move[]) => {
        // local game just plays the moves - we dont need to send anything
        setBoardState(
            playMoves(moves, board)
        );
    }

    return (
        <Board boardState={board} setBoardState={setBoardState} 
        dispatchMoves={makeMoves} animate={animate} setAnimate={setAnimate} options={options} />
    );

}
