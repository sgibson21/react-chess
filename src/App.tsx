import './App.css';
import { Board, BoardOptions } from './board/Board';
import store from './app/store'
import { Provider } from 'react-redux'
import { io } from "socket.io-client";
import { BoardInternalState } from './board/board-utils';
import { initBoard, loadPositionFromFen, START_FEN } from './board/board-utils';
import { GameType, Settings } from './settings/Settings';
import { useState } from 'react';

const socket = io("ws://localhost:8000");

function App() {

  socket.emit("new-game", 123);

  socket.on("connection_status", res => {
    console.log('websocket connection_status:', res);
  });

  const state: BoardInternalState = loadPositionFromFen(START_FEN, initBoard());
  const [gameType, setGameType] = useState<GameType | null>(null);

  const options: BoardOptions = {
    useWebSockets: gameType === GameType.online,
    allowFlip: gameType === GameType.local
  };

  return (
    <Provider store={store}>
      <div className="App">
        <h1>React Chess</h1>
        {
          !gameType && <Settings onClick={option => setGameType(option)} />
        }
        {
          gameType && <Board initialState={state} socket={socket} options={options} />
        }
      </div>
    </Provider>
  );
}

export default App;
