import { ReactNode, useEffect, useState } from 'react';
import './SettingsCard.css';

interface SettingsCardProps {
    title: string;
    imgSrc: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    children?: ReactNode;
}

export function SettingsCard({ title, imgSrc, onClick, children }: SettingsCardProps) {

    // default object-position 50%
    const [position, setPosition] = useState(50);

    useEffect(() => {
        const callback = (e: MouseEvent) => setPosition(40 + Math.floor(e.clientX / window.innerWidth * 20));
        document.addEventListener('mousemove', callback);

        return () => document.removeEventListener('mousemove', callback);
    }, []);

    return (
        <div className="image-container" onClick={onClick}>
            <div className='content'>
                <h2 className="image-title">{title}</h2>
                { children }
            </div>
            <img style={{objectPosition: `${position}% bottom`}} className="image" src={imgSrc} />
        </div>
    );
}
