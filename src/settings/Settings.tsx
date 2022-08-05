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
    return (
        <div className="settings">
            <div className="setting-option" onClick={() => props.onClick(GameType.local)}>Local Play</div>
            <div className="setting-option" onClick={() => props.onClick(GameType.online)}>Online</div>
            <div className="setting-option" onClick={() => props.onClick(GameType.analysis)}>Analysis</div>
        </div>
    )
}
