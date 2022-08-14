import { Board, BoardOptions } from '../board/Board';
import './OnlineGame.css';
import useOnlineGame from './useOnlineGame';

type OnlineGameProps = {
  onBack: () => void;
}

export function OnlineGame({onBack}: OnlineGameProps) {

  const [
    board,
    side,
    info,
    error,
    makeMove,
    closeConnection
  ] = useOnlineGame();

  const goBack = () => {
    closeConnection();
    onBack();
  };

  const options: BoardOptions = {
    allowFlip: false,
    side: side || undefined
  };

  if (error) {
    return <div className="msg">
      <h3 className="error">{ error || 'Connection Error' }</h3>
      <p className="info back"><a onClick={() => goBack()}>Back</a></p>
    </div>
  }

  if (info) {
    return <div className="msg info"><h3>{info}</h3></div>
  }

  return <Board boardState={board} makeMove={makeMove} options={options} />

}
