import './App.css';
import { Board, BoardOptions } from './board/Board';
import store from './app/store'
import { Provider } from 'react-redux'
import { BoardState } from './board/utils/board-utils';
import { initBoard, loadPositionFromFen, START_FEN } from './board/utils/board-utils';
import { GameType, Settings } from './settings/Settings';
import { useState } from 'react';
import { OnlineGame } from './game/OnlineGame';

function App() {

  const [board, setBoard] = useState<BoardState>();
  const [gameType, setGameType] = useState<GameType | null>(null);

  const onOptionSelect = (option: GameType) => {
    setBoard(loadPositionFromFen(START_FEN, initBoard()));
    setGameType(option);
  };

  const makeMove = (state: BoardState) => {
    setBoard(state);
  };

  const options: BoardOptions = {
    allowFlip: gameType === GameType.local
  };

  return (
    <Provider store={store}>
      <div className="App">
        <h1 onClick={() => setGameType(null)}>React Chess</h1>
        {
          !gameType && <Settings onClick={onOptionSelect} />
        }
        {
          !!gameType && gameType !== GameType.online && board && <Board boardState={board} makeMove={makeMove} options={options} />
        }
        {
          gameType === GameType.online && <OnlineGame onBack={() =>setGameType(null)} />
        }
      </div>
    </Provider>
  );
}

export default App;
