import './App.css';
import { Board, BoardOptions } from './board/Board';
import store from './app/store'
import { Provider } from 'react-redux'
import { BoardState, isCheckmate } from './board/utils/board-utils';
import { initBoard, loadPositionFromFen, START_FEN } from './board/utils/board-utils';
import { GameType, Settings } from './settings/Settings';
import { useState } from 'react';
import { OnlineGame } from './game/OnlineGame';
import { CheckmateModal } from './shared/checkmate-modal/CheckmateModal';

function App() {

  const [board, setBoard] = useState<BoardState>();
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [isMate, setIsMate] = useState(false);

  const onOptionSelect = (option: GameType) => {
    setBoard(loadPositionFromFen(START_FEN, initBoard()));
    setGameType(option);
  };

  const makeMove = (state: BoardState) => {
    setBoard(state);
    const isMate = isCheckmate(state);
    setIsMate(isMate);
  };

  const reset = () => {
    setGameType(null);
    setIsMate(false);
  };

  const options: BoardOptions = {
    allowFlip: gameType === GameType.local
  };

  return (
    <Provider store={store}>
      <div className="App">
        <h1 onClick={() => reset()}>React Chess</h1>
        {
          !gameType && <Settings onClick={onOptionSelect} />
        }
        {
          !!gameType && gameType !== GameType.online && board && <Board boardState={board} makeMove={makeMove} options={options} />
        }
        {
          gameType === GameType.online && <OnlineGame onBack={() => reset()} />
        }
        {
          board && isMate && <CheckmateModal winner={board.playersTurn === 'white' ? 'black' : 'white'} onClose={() => setIsMate(false)} onNewGame={() => {}} onMainMenu={() => {}}/>
        }
      </div>
    </Provider>
  );
}

export default App;
