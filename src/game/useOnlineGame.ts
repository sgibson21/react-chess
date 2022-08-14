import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { useEffect, useState } from 'react';
import { BoardState, initBoard, loadPositionFromFen, START_FEN } from '../board/utils/board-utils';
import { pieceColor } from '../board/types';
import useUserId from '../board/hooks/useUserId';
import onlineGameHandlers from './online-game-handlers';

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

type UseOnlineGameReturnValue = [
    board: BoardState,
    side: pieceColor | null,
    info: string | null,
    error: string | null,
    makeMove: (state: BoardState) => void,
    closeConnection: () => void
];

export default function useOnlineGame(): UseOnlineGameReturnValue {

  const [board, setBoard] = useState<BoardState>(loadPositionFromFen(START_FEN, initBoard()));
  const [side, setSide] = useState<pieceColor | null>(null);
  const [userId] = useUserId();
  const [info, setInfo] = useState<string | null>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const ip = 'localhost'; // process.env.REACT_APP_CHESS_IP; // use ip env var when playing on network

  const handlePlayerResponse = (players: string[]) => {
    const [player1] = players;
    setSide(userId === player1 ? 'white' : 'black');
    setInfo(null);
  };

  const closeConnection = () => {
    socket.disconnect();
    socket.close();
  };

  const newGamePayload = {
    userId: userId,
    gameId: 'gameId123'
  };

  const {
    connect,
    connection_status,
    connect_error,
    new_game,
    player_found,
    state_update,
    state_change
  } = onlineGameHandlers({ setBoard, setInfo, setError, handlePlayerResponse });

  useEffect(() => {

    if (!ip) {
        setError('No Websocket IP Address found');
        return;
    }

    socket = io(`ws://${ip}:8000`);

    socket.on('connection_status', connection_status);
    socket.on('connect', connect);
    socket.on('connect_error', connect_error);
    socket.on('player_found', player_found);
    socket.on('state_update', state_update);

    socket.emit('new_game', newGamePayload, new_game);

    // cleanup
    return () => closeConnection();

  }, [ip, userId]);

  const makeMove = (state: BoardState) => {
    socket.emit('state_change', state, state_change(state));
  };

  return [
    board,
    side,
    info,
    error,
    makeMove,
    closeConnection
  ];

};
