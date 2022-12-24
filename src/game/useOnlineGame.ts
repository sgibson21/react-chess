import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { useEffect, useState } from 'react';
import { initBoard, loadPositionFromFen, move, START_FEN } from '../board/utils/board-utils';
import { pieceColor } from '../board/types';
import onlineGameHandlers from './online-game-handlers';
import { useDispatch } from 'react-redux';
import { PLAY_MOVES, setboardState } from '../app/boardStateSlice';
import { SET_ANIMATION } from '../app/animationSlice';
import { useOnlineUsername } from '../app/settingsSlice';

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

type UseOnlineGameReturnValue = [
  side: pieceColor | undefined,
  info: string | null,
  error: string | null,
  makeMoves: (moves: move[]) => void,
  closeConnection: () => void,
];

export default function useOnlineGame(): UseOnlineGameReturnValue {

  const dispatch = useDispatch();
  dispatch(setboardState(loadPositionFromFen(START_FEN, initBoard())));

  const [side, setSide] = useState<pieceColor | undefined>();
  const userId = useOnlineUsername();
  const [info, setInfo] = useState<string | null>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const ip = process.env.REACT_APP_CHESS_IP; // use ip env var when playing on network

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
  } = onlineGameHandlers({ setInfo, setError, handlePlayerResponse });

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

    socket.emit('new_game', newGamePayload, new_game);

    // cleanup
    return () => closeConnection();

  }, [ip, userId]);

  // separate useEffect because board is a dependency
  useEffect(() => {
    socket.on('move_made', (moves: move[]) => {
      dispatch(SET_ANIMATION(true));
      dispatch(PLAY_MOVES(moves));
    });
    // cleanup
    return () => {
      socket.off('move_made');
    };
  }, [ip, userId]);

  const makeMoves = (moves: move[]) => {
    socket.emit('make_move', moves, (res: {status: number}) => {
      if (res.status === 200) {
        console.log('moves sent successfully:', moves);
        dispatch(PLAY_MOVES(moves));
      }
    });
  };

  return [
    side,
    info,
    error,
    makeMoves,
    closeConnection,
  ];

};
