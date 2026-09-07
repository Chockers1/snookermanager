export function FormResult({result}:{result:string}){
 const value=result.toUpperCase();const won=value==='W'||value==='WON',lost=value==='L'||value==='LOST';const label=won?'Win':lost?'Loss':value==='D'||value==='DRAWN'?'Draw':'Unknown';
 return <span aria-label={label} title={label} className={'inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded border px-0.5 text-[9px] font-bold '+(won?'border-green-400/50 bg-green-500/15 text-green-200':lost?'border-red-400/50 bg-red-500/15 text-red-200':'border-gray-400/50 text-gray-200')}>{won?'W':lost?'L':label==='Draw'?'D':'?'}</span>;
}
