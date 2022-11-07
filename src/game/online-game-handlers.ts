type OnlineGameHandlersProps = {
    setInfo: (info: string | null) => void;
    setError: (error: string | null) => void;
    handlePlayerResponse: (players: string[]) => void;
};

export default function ({ setError, setInfo, handlePlayerResponse }: OnlineGameHandlersProps) {
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
    };
}
