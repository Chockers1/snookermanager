import { useGame } from '../../context/useGame';
import { playerMentionIndex } from '../../game/playerMentions';
import { PlayerLink } from './PlayerLink';

/** Render stored prose with links to known players; never scan archived results. */
export function PlayerNames({ text }: { text: string | undefined | null }) {
  const { gameState } = useGame();
  return <>{playerMentionIndex(gameState.worldPlayers)(text ?? '').map((part, index) => part.id
    ? <PlayerLink key={index} name={part.text} id={part.id} /> : part.text)}</>;
}
