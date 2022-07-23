import './App.css';
import { Board } from './board/Board';
import store from './app/store'
import { Provider } from 'react-redux'
import { io } from "socket.io-client";
import { MovablePiece } from './board/MovablePiece';
import { DndProvider } from 'react-dnd';
import { CustomDragLayer } from './board/CustomDragLayer';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BoardInternalState } from './board/board-state';
import { initBoard, loadPositionFromFen, START_FEN } from './board/board-utils';

// const socket = io("ws://localhost:8000");

function App() {

  console.log('App.tsx');
  // socket.emit("new-game", 123);

  // socket.on("connection_status", res => {
  //   console.log('websocket connection_status:', res);
  // });

  const state: BoardInternalState = loadPositionFromFen(START_FEN, initBoard());

  return (
    <Provider store={store}>
      <div className="App">
          <Board state={state} />
      </div>
    </Provider>
  );
}

export default App;
