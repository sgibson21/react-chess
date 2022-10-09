import './App.css';
import store from './app/store'
import { Provider } from 'react-redux'
import { BoardState, isCheckmate } from './board/utils/board-utils';
import { initBoard, loadPositionFromFen, START_FEN } from './board/utils/board-utils';
import { GameType, Settings } from './settings/Settings';
import { useState } from 'react';
import { OnlineGame } from './game/OnlineGame';
import { CheckmateModal } from './shared/checkmate-modal/CheckmateModal';
import { LocalGame } from './game/LocalGame';
import { BoardOptions } from './board/Board';

function App() {

  const [board, setBoard] = useState<BoardState>();
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [isMate, setIsMate] = useState(false);

  const onOptionSelect = (option: GameType) => {
    // setBoard(loadPositionFromFen(START_FEN, initBoard()));
    setBoard(loadPositionFromFen('r3k2r/pP2pppp/2p5/3pP3/8/8/PPPP1PPP/R3K2R w K d6', initBoard()));
    setIsMate(false);
    setGameType(option);
  };

  const setBoardState = (state: BoardState) => {
    setBoard(state);
    const isMate = isCheckmate(state);
    setIsMate(isMate);
  };

  const mainMenu = () => {
    setGameType(null);
    setIsMate(false);
  };

  const options: BoardOptions = {
    allowFlip: gameType === GameType.local
  };

  return (
    <Provider store={store}>
      <div className="App">
        <h1 onClick={() => mainMenu()}>React Chess</h1>
        {
          !gameType && <Settings onClick={onOptionSelect} />
        }
        {
          !!gameType && gameType !== GameType.online && board &&
          <LocalGame boardState={board} setBoardState={setBoardState} options={options} />
        }
        {
          gameType === GameType.online && <OnlineGame onBack={() => mainMenu()} />
        }
        {
          board && isMate && <CheckmateModal
            winner={board.playersTurn === 'white' ? 'black' : 'white'}
            onClose={() => setIsMate(false)}
            onNewGame={() => gameType && onOptionSelect(gameType)}
            onMainMenu={() => mainMenu()}
          />
        }
      </div>
    </Provider>
  );
}

export default App;
