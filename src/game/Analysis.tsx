import { FC } from "react";
import { BoardOptions } from "../board/Board";
import { LocalBoard } from "../board/LocalBoard";

export const Analysis: FC = () => {

    const options: BoardOptions = {
        allowFlip: false
    };

    return <LocalBoard options={options} />
}
