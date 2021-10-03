import React from 'react';
import { BoardState, files } from './board-state';
import './Board.css';
import { Square } from './Square';
import { file, rank } from './types';

const board = [
    files,
    files,
    files,
    files,
    files,
    files,
    files,
    files,
];

type BoardComponentState = {
    board: BoardState;
};

export class Board extends React.Component<{}, BoardComponentState> {

    constructor(props: any) {
        super(props);

        this.state = {
            board: new BoardState()
        };

    }

    render() {
        return (
            <div className="board">
                {board.map((r, i) => this.rankEl(8 - i as rank))}
            </div>
        );
    }

    private squareEl(file: file, rank: rank) {
        const square: Square = this.state.board.getSquare(file, rank);
        const sqColor = square.getColor();
        const isActive = this.state.board.isActiveSq(file, rank);
        const isAvailable = this.state.board.isAvailableSquare(file, rank);
        return (
            <div
                key={file}
                className={`square ${sqColor} ${isActive && 'active'}`}
                onClick={() => this.squareClicked(file, rank)}
            >
                {
                  rank === 1 &&
                  <div className="label file-label">{file}</div>
                }
                {
                  file === 'a' &&
                  <div className="label rank-label">{rank}</div>
                }
                {
                  isAvailable &&
                  <div className="available-indicator"></div>
                }
                {
                  square.piece &&
                  <div className={`piece ${square.piece.imgClass}`}></div>
                }
            </div>
        );
    }

    private rankEl(rank: rank) {
        return (
            <div key={rank} className="rank">
                {files.map(file => this.squareEl(file, rank))}
            </div>
        );
    }
    
    private squareClicked(file: file, rank: rank) {
        // set active piece if they've clicked their own piece and it's their turn
        if (this.state.board.isOwnPiece(file, rank) && !this.state.board.isActiveSq(file, rank) && this.state.board.isPlayersTurn(file, rank)) {
            this.setState({
                board: this.state.board.setActiveSquare(file, rank)
            });
        }
        // clear the active square if it's active and they've clicked it again
        else if (this.state.board.hasActiveSq() && this.state.board.isActiveSq(file, rank)) {
            this.setState({
                board: this.state.board.clearActiveSq()
            });
        }
        // move the piece if there's an active piece and they havn't clicked their own piece
        else if (this.state.board.hasActiveSq() && !this.state.board.isOwnPiece(file, rank)) {
            this.setState({
                board: this.state.board.movePieceTo({file, rank})
            });
        }
    }

}
