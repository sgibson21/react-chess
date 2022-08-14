import { useState } from 'react';

const SESSION_KEY = 'react-chess-user-id';

export default function useUserId(): [string | null, (userId: string) => void] {

    const [uid, setUid] = useState(sessionStorage.getItem(SESSION_KEY));

    return [
        uid,
        (userId: string) => {
            sessionStorage.setItem(SESSION_KEY, userId);
            setUid(userId);
        }
    ];
}
