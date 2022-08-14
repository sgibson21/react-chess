import { BoardState } from '../board/utils/board-utils';

type OnlineGameHandlersProps = {
    setBoard: (board: BoardState) => void;
    setInfo: (info: string | null) => void;
    setError: (error: string | null) => void;
    handlePlayerResponse: (players: string[]) => void;
};

export default function ({ setError, setInfo, setBoard, handlePlayerResponse }: OnlineGameHandlersProps) {
    return {
        connection_status: (res: {count: number}) => {
            console.log('websocket connection_status:', res);
        },
        connect: () => {
            console.log('connection established');
            setError(null);
        },
        connect_error: (err: Error) => {
            setError(err.message);
        },
        new_game: (res: any) => {
            if (Array.isArray(res)) {
                handlePlayerResponse(res);
            } else if (typeof res === 'string') {
                setInfo(res);
            }
            console.log('new game', res);
        },
        player_found: (res: any) => {
            if (Array.isArray(res)) {
                handlePlayerResponse(res);
            }
        },
        state_update: (res: any) => {
            console.log('state update from web socket:', res);
            setBoard(res);
        },
        state_change: (state: BoardState) => {
            return (res: {status: number}) => {
                if (res.status === 200) {
                    setBoard(state);
                }
            }
        }
    };
}
