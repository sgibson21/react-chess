import './App.css';
import { Board } from './board/Board';
import store from './app/store'
import { Provider } from 'react-redux'
import { io } from "socket.io-client";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BoardInternalState } from './board/board-utils';
import { initBoard, loadPositionFromFen, START_FEN } from './board/board-utils';

const socket = io("ws://localhost:8000");

function App() {

  socket.emit("new-game", 123);

  socket.on("connection_status", res => {
    console.log('websocket connection_status:', res);
  });

  const state: BoardInternalState = loadPositionFromFen(START_FEN, initBoard());

  return (
    <Provider store={store}>
      <div className="App">
        <DndProvider backend={HTML5Backend}>
          <Board initialState={state} socket={socket}/>
        </DndProvider>
      </div>
    </Provider>
  );
}

export default App;
