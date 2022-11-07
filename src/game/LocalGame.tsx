import { FC } from "react";
import { usePlayerTurn } from "../app/boardStateSlice";
import { BoardOptions } from "../board/Board";
import { LocalBoard } from "../board/LocalBoard";
import { pieceColor } from "../board/types";

export const LocalGame: FC = () => {

    const playersTurn: pieceColor = usePlayerTurn();

    const options: BoardOptions = {
        allowFlip: true
    };

    return <div className={`local-game allow-flip player-${playersTurn}`}>
        <LocalBoard options={options} />
    </div>

}
