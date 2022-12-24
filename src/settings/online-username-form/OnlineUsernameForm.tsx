import { useState } from "react";
import { useDispatch } from "react-redux";
import { SET_ONLINE_USERNAME, useOnlineUsername } from "../../app/settingsSlice";

interface OnlineUsernameFormProps {
    showForm: boolean;
    onSubmit: (username: string) => void;
}

export function OnlineUsernameForm({ showForm, onSubmit: onComplete }: OnlineUsernameFormProps) {
    const savedUserId = useOnlineUsername();
    const [userId, setUserId] = useState(savedUserId);
    const dispatch = useDispatch();

    const onSubmit = () => {
        if (userId) {
            dispatch(SET_ONLINE_USERNAME(userId));
            onComplete(userId);
        }
    };

    const deleteUsername: React.MouseEventHandler<HTMLSpanElement> = (e) => {
        dispatch(SET_ONLINE_USERNAME(null));
        setUserId(null);
        e.stopPropagation();
    };

    if (!savedUserId && showForm) {
        return (
            <form onSubmit={onSubmit}>
                <div className='username-input-container'>
                    <input type='text' placeholder='Enter a Username' value={userId || ''} onChange={e => setUserId(e.target.value)} />
                    <input id='submit-btn' type='button' value='Go' onClick={onSubmit} />
                </div>
            </form>
        );
    }

    if (savedUserId) {
        return (
            <span className='existing-username'>
                <span style={{color: 'white', fontSize: '2vmin'}}>{ savedUserId && `(${savedUserId})` }</span>
                <span className='remove-user' onClick={deleteUsername}>&#x1f7a9;</span>
            </span>
        );
    }

    return <></>;
}
