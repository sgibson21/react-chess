import React from 'react';
import { BoardState, files } from './board-state';
import './Board.css';
import { rank } from './types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SquareEl } from './SquareEl';
import { CustomDragLayer } from './CustomDragLayer';

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

    private historyListener = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
            this.setState({ board: this.state.board.forward() });
        } else if (e.key === 'ArrowLeft') {
            this.setState({ board: this.state.board.back() });
        }
    };

    constructor(props: any) {
        super(props);

        this.state = {
            board: new BoardState()
        };

    }

    componentDidMount() {
        document.addEventListener('keydown', this.historyListener);
    }
  
    componentWillUnmount() {
        document.removeEventListener('keydown', this.historyListener);
    }

    render() {
        return (
            <DndProvider backend={HTML5Backend}>
                <CustomDragLayer board={this.state.board}/>
                <div className="board">
                    {board.map((r, i) => this.rankEl(8 - i as rank))}
                </div>
            </DndProvider>
        );
    }

    private rankEl(rank: rank) {
        return (
            <div key={rank} className="rank">
                {files.map(file => (
                    <SquareEl 
                        key={file}
                        board={this.state.board}
                        file={file}
                        rank={rank}
                        setBoard={(board: BoardState) => this.setState({ board })}
                    />
                ))}
            </div>
        );
    }

}
