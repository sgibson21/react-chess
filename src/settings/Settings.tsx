import { useState } from 'react';
import useUserId from '../board/hooks/useUserId';
import './Settings.css';

export enum GameType {
    local = 1,
    online = 2,
    analysis = 3,
}

type SettingsProps = {
    onClick: (option: GameType) => void;
};

export function Settings(props: SettingsProps) {

    const [savedUserId, setSavedUserId] = useUserId();
    const [userId, setUserId] = useState(savedUserId);
    const [userRequired, setUserRequired] = useState(false);

    const onSubmit = () => {
        if (userId) {
            setSavedUserId(userId);
            props.onClick(GameType.online);
        }
    };

    const onlineSelected = () => {
        if (savedUserId) {
            props.onClick(GameType.online);
        } else {
            setUserRequired(true);
        }
    }

    const userInput = <form onSubmit={onSubmit}>
        <label>Username:</label>
        <input value={userId || ''} onChange={e => setUserId(e.target.value)} />
        <input type='submit' />
    </form>

    const onlineOption = <span>Online { savedUserId && `(${savedUserId})` }</span>

    return (
        <div className="settings">
            <div className="setting-option" onClick={() => props.onClick(GameType.local)}>Local Play</div>
            <div className="setting-option" onClick={onlineSelected}>
                {
                    userRequired && !savedUserId ? userInput : onlineOption
                }
            </div>
            <div className="setting-option" onClick={() => props.onClick(GameType.analysis)}>Analysis</div>
        </div>
    )
}
