import { useState } from 'react';
import { useOnlineUsername } from '../app/settingsSlice';
import { OnlineUsernameForm } from './online-username-form/OnlineUsernameForm';
import { SettingsCard } from './settings-card/SettingsCard';
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

    const savedUserId = useOnlineUsername();
    const [onlineCardSelected, setOnlineCardSelected] = useState(false);


    const onSubmit = (username: string) => {
        if (username) {
            props.onClick(GameType.online);
        }
    };

    const onOnlineCardSelected = () => {
        if (savedUserId) {
            props.onClick(GameType.online);
        } else {
            setOnlineCardSelected(true);
        }
    }

    return (
        <div className="scrolled-settings">
            <SettingsCard title="Local Play" onClick={() =>props.onClick(GameType.local)} imgSrc="https://images.unsplash.com/photo-1599325313240-0402a1ba2c66?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1048&q=80" />
            <SettingsCard title="Online Play" onClick={onOnlineCardSelected} imgSrc="https://images.unsplash.com/photo-1616996721984-ae86ad6c3b60?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80" >
                <OnlineUsernameForm showForm={onlineCardSelected} onSubmit={(username: string) => onSubmit(username)} />
            </SettingsCard>
            <SettingsCard title="Analysis"  onClick={() =>props.onClick(GameType.analysis)} imgSrc="https://images.unsplash.com/photo-1529699310859-b163e33e4556?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80" />
        </div>
    );
}
