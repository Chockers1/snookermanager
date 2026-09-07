import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
function playerProfilePath(nameOrId:string) { return '/players/'+encodeURIComponent(nameOrId); }
export function PlayerLink({name,id,children,className='',onNavigate}:{name:string;id?:string;children?:ReactNode;className?:string;onNavigate?:()=>void}) {
 if(!name||/TBD|Awaiting|Unknown/.test(name)||/^Qualifier \d+$/.test(name))return <span className={className}>{children??name}</span>;
 return <Link className={'hover:text-green-400 hover:underline underline-offset-2 '+className} to={playerProfilePath(id??name)} onClick={e=>{e.stopPropagation();onNavigate?.()}}>{children??name}</Link>;
}
