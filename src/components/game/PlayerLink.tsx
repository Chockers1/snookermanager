import { Link } from 'react-router-dom';
import { useContext, type ReactNode } from 'react';
import { GameStateContext } from '../../context/gameStateContextValue';
function playerProfilePath(nameOrId:string) { return '/players/'+encodeURIComponent(nameOrId); }
export function PlayerLink({name,id,children,className='',onNavigate}:{name:string;id?:string;children?:ReactNode;className?:string;onNavigate?:()=>void}) {
 const context = useContext(GameStateContext);
 const target = name === context?.gameState.player.fullName ? name : id ?? name;
 if(!name||/TBD|Awaiting|Unknown/.test(name)||/^Qualifier \d+$/.test(name))return <span className={className}>{children??name}</span>;
 return <Link className={'hover:text-green-400 hover:underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-400 rounded-sm '+className} to={playerProfilePath(target)} onClick={e=>{e.stopPropagation();onNavigate?.()}}>{children??name}</Link>;
}
