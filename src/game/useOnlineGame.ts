import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { useEffect, useState } from 'react';
import { BoardState, initBoard, loadPositionFromFen, move, START_FEN } from '../board/utils/board-utils';
import { pieceColor } from '../board/types';
import useUserId from '../board/hooks/useUserId';
import onlineGameHandlers from './online-game-handlers';
import { playMoves } from '../board/utils/board-utils';

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

type UseOnlineGameReturnValue = [
  board: BoardState,
  side: pieceColor | undefined,
  info: string | null,
  error: string | null,
  animate: boolean,
  setBoard: (state: BoardState) => void,
  makeMoves: (moves: move[]) => void,
  closeConnection: () => void,
  setAnimate: (animate: boolean) => void
];

export default function useOnlineGame(): UseOnlineGameReturnValue {

  const [board, setBoard] = useState<BoardState>(loadPositionFromFen(/*START_FEN*/'r3k2r/pP2pppp/2p5/3pP3/8/8/PPPP1PPP/R3K2R w K d6', initBoard()));
  const [side, setSide] = useState<pieceColor | undefined>();
  const [userId] = useUserId();
  const [info, setInfo] = useState<string | null>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [animate, setAnimate] = useState(true);
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
    state_update,
    state_change,
    move_made
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

  // separate useEffect because board is a dependency
  useEffect(() => {
    // socket.on('move_made', move_made(board));
    socket.on('move_made', (moves: move[]) => {
      setAnimate(true);
      return move_made(board)(moves);
    });
    // cleanup
    return () => {
      socket.off('move_made');
    };
  }, [ip, userId, board]);

  const makeMoves = (moves: move[]) => {
    socket.emit('make_move', moves, (res: {status: number}) => {
      if (res.status === 200) {
        const state = playMoves(moves, board);
        console.log('moves sent successfully:', moves, state);
        setBoard(state);
      }
    });
  };

  return [
    board,
    side,
    info,
    error,
    animate,
    setBoard,
    makeMoves,
    closeConnection,
    setAnimate
  ];

};
