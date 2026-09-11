import fs from 'node:fs';
import { gzipSync, strToU8 } from 'fflate';
import { encodeCareerSave, decodeCareerSave } from '../src/game/saveStorage';
const source=process.argv[2];
const json=fs.readFileSync(source,'utf8');
const rows=[];
for(const level of [1,3,6] as const){const start=performance.now(),bytes=gzipSync(strToU8(json),{level,mtime:0});rows.push({level,milliseconds:performance.now()-start,bytes:bytes.length});}
const state=JSON.parse(json),start=performance.now(),payload=encodeCareerSave(state),encoded=performance.now(),decoded=decodeCareerSave(payload),end=performance.now();
if(decoded!==json)throw Error('Codec mismatch');
const result={source,jsonBytes:Buffer.byteLength(json),levels:rows,codec:{encodeMs:encoded-start,decodeMs:end-encoded,characters:payload.length,utf16Bytes:payload.length*2,exactRoundtrip:true}};
fs.mkdirSync('artifacts/retirement-fixes',{recursive:true});fs.writeFileSync('artifacts/retirement-fixes/codec-benchmark.json',JSON.stringify(result,null,2));console.log(result);
