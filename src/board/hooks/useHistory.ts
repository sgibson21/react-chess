import { useEffect } from 'react';
import { BoardInternalState } from '../board-utils';

export default function useHistory(board: BoardInternalState, onBack: () => void, onForward: () => void) {

    const historyListener = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
            onForward();
        } else if (e.key === 'ArrowLeft') {
            onBack();
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', historyListener);

        // clean up
        return () => document.removeEventListener('keydown', historyListener);
    }, [board]);
}
