import './App.css';
import { useDispatch } from 'react-redux'
import { initBoard, loadPositionFromFen, START_FEN } from './board/utils/board-utils';
import { GameType, Settings } from './settings/Settings';
import { useState } from 'react';
import { OnlineGame } from './game/OnlineGame';
import { setboardState } from './app/boardStateSlice';
import { LocalGame } from './game/LocalGame';
import { Analysis } from './game/Analysis';
import { CheckmateModal } from './shared/checkmate-modal/CheckmateModal';
import { SET_GAME_OVER_WINDOW_CLOSED } from './app/settingsSlice';

function App() {

  const [gameType, setGameType] = useState<GameType | null>(null);
  const dispatch = useDispatch();

  const newBoard = () => {
    dispatch(SET_GAME_OVER_WINDOW_CLOSED(false));
    dispatch(setboardState(loadPositionFromFen(START_FEN, initBoard())));
  };

  const onOptionSelect = (option: GameType) => {
    newBoard();
    setGameType(option);
  };

  const mainMenu = () => {
    newBoard();
    setGameType(null);
  };

  return (
    <div className="App">
      <h1 onClick={() => mainMenu()}>React Chess</h1>
      {
        !gameType && <Settings onClick={onOptionSelect} />
      }
      {
        !!gameType && gameType === GameType.local &&
        <LocalGame />
      }
      {
        !!gameType && gameType === GameType.analysis &&
        <Analysis />
      }
      {
        gameType === GameType.online && <OnlineGame onBack={() => mainMenu()} />
      }
      {
        <CheckmateModal
          onNewGame={() => gameType && onOptionSelect(gameType)}
          onMainMenu={() => mainMenu()}
        />
      }
    </div>
  );
}

export default App;
