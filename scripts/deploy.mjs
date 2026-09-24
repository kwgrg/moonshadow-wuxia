import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
export function deploymentArguments(args){
 assert.ok(args.length===0||(args.length===1&&args[0]==='--dry-run'),
  'Only --dry-run is accepted. Change and review wrangler.jsonc instead of overriding the checked publication input.');
 return ['deploy','--config',path.join(root,'wrangler.jsonc'),'--assets',path.join(root,'public'),'--no-autoconfig',...args];
}
function run(script,args){
 const result=spawnSync(process.execPath,[script,...args],{cwd:root,stdio:'inherit',windowsHide:true});
 if(result.error)console.error(result.error.message);
 return result.status??1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  // Validate arguments before launching either child; never pass arbitrary CLI input.
  const args=deploymentArguments(process.argv.slice(2));
  process.exitCode=run(path.join(root,'tests/validate-asset-provenance.mjs'),['--for-publication']);
  if(process.exitCode===0)process.exitCode=run(path.join(root,'node_modules/wrangler/bin/wrangler.js'),args);
 }catch(error){console.error(error.message);process.exitCode=1;}
}
