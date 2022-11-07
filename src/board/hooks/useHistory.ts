import { useEffect } from 'react';

export default function useHistory(onBack: () => void, onForward: () => void) {

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
    }, []);
}
