import { DragPreviewImage, useDrag } from "react-dnd"
import { Piece } from '../pieces/piece';

import bb from '../assets/bb.png';
import bk from '../assets/bk.png';
import bn from '../assets/bn.png';
import bp from '../assets/bp.png';
import bq from '../assets/bq.png';
import br from '../assets/br.png';
import wb from '../assets/wb.png';
import wk from '../assets/wk.png';
import wn from '../assets/wn.png';
import wp from '../assets/wp.png';
import wq from '../assets/wq.png';
import wr from '../assets/wr.png';
import { BoardState } from "./board-state";
import { file, rank } from "./types";

const images = {bb, bk, bn, bp, bq, br, wb, wk, wn, wp, wq, wr};

interface DraggablePieceProps {
    board: BoardState;
    piece: Piece;
    file: file;
    rank: rank;
    setBoard: (board: BoardState) => void;
}

export const DraggablePiece = ({ board, piece, file, rank, setBoard }: DraggablePieceProps) => {
    const [{ isDragging }, drag, preview] = useDrag(() => {
        return {
            type: 'piece', // TODO: does this need to be more specific?
            item: () => {
                // This is the function run at the begining of a drag
                if (board.isOwnPiece(file, rank)) {
                    setBoard(board.setActiveSquare(file, rank));
                }
                // always returning the piece allows you to drag any piece, but only your own pieces can be set as the active square
                return piece;
            },
            collect: monitor => ({ isDragging: !!monitor.isDragging() })
        };
    }, []);

    return (
        <>
            <DragPreviewImage connect={preview} src={images[piece.imgClass]} />
            <div  ref={drag} style={{  visibility: isDragging ? 'hidden' : 'visible' }}>
                <div className={`piece ${piece.imgClass}`}></div>
            </div>
        </>
    )
}
