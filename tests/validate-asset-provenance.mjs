import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {deploymentArguments} from '../scripts/deploy.mjs';

// Repository-only inventory integrity. This does not inspect the reference game,
// contact a service, read image-generator directories, or certify legal origin.
const root=fs.realpathSync(fileURLToPath(new URL('../',import.meta.url)));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/asset-provenance.json'),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const inside=(base,target)=>{const relative=path.relative(base,target);return relative!==''&&!path.isAbsolute(relative)&&relative!=='..'&&!relative.startsWith('..'+path.sep);};
function localFile(relative,prefix){
 assert.equal(typeof relative,'string','local path must be a string');
 assert.ok(!path.posix.isAbsolute(relative)&&!path.win32.isAbsolute(relative),'absolute paths are forbidden');
 assert.match(relative,/^[a-z0-9._/-]+$/,'local paths must use canonical lowercase forward-slash names');
 assert.ok(relative.split('/').every(part=>part&&part!=='.'&&part!=='..'),'path traversal or empty components are forbidden');
 assert.ok(relative.startsWith(prefix+'/'),'path is outside its allowed scope: '+relative);
 const resolved=path.resolve(root,relative),base=path.resolve(root,prefix);
 for(let directory=base;directory!==root;directory=path.dirname(directory)){
  assert.ok(!fs.lstatSync(directory).isSymbolicLink(),'source roots must not be symlinks or junctions');
 }
 assert.ok(inside(root,fs.realpathSync(base)),'source root escaped the repository');
 assert.ok(inside(base,resolved),'resolved path escaped its allowed scope');
 assert.ok(fs.existsSync(resolved),'missing local file: '+relative);
 assert.ok(fs.statSync(resolved).isFile(),'local record must be a file: '+relative);
 // Covers a junction/symlink in a parent directory as well as in the file.
 assert.ok(inside(fs.realpathSync(base),fs.realpathSync(resolved)),'real path escaped its allowed scope');
 return resolved;
}
function discoverPublishedPngs(directory=path.join(root,'public')){
 const files=new Map();let fileCount=0;
 assert.ok(!fs.lstatSync(directory).isSymbolicLink(),'public root must not be a symlink or junction');
 const publicRoot=fs.realpathSync(directory);
 function walk(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
   const absolute=path.join(directory,entry.name),relative='public/'+path.relative(publicRoot,absolute).split(path.sep).join('/');
   assert.ok(!entry.isSymbolicLink(),'public symlinks cannot bypass the inventory: '+relative);
   assert.match(entry.name,/^[a-z0-9][a-z0-9._-]*$/,'public names must be canonical lowercase names: '+relative);
   assert.ok(inside(publicRoot,fs.realpathSync(absolute)),'public real path escaped its allowed scope: '+relative);
   if(entry.isDirectory()){walk(absolute);continue;}
   assert.ok(entry.isFile(),'unexpected public file type: '+relative);
   const extension=path.extname(entry.name),png=extension==='.png';
   assert.ok(['.html','.css','.js','.mjs','.png'].includes(extension),'unsupported published file type: '+relative);
   if(relative.startsWith('public/assets/'))assert.ok(png,'unsupported asset type must be explicitly added to the provenance checker: '+relative);
   const bytes=fs.readFileSync(absolute);
   if(png){
    assert.ok(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'published PNG has an invalid signature: '+relative);
    files.set(relative,hash(bytes));
   }else{
    assert.ok(!bytes.includes(0),'binary data in published source file: '+relative);
    assert.doesNotThrow(()=>new TextDecoder('utf-8',{fatal:true}).decode(bytes),'published source must be UTF-8 text: '+relative);
   }
   fileCount++;
  }
 }
 walk(publicRoot);return {pngs:files,fileCount};
}
function validatePublicationConfig(config){
 assert.deepEqual(Object.keys(config).sort(),['$schema','assets','compatibility_date','name','workers_dev'].sort(),'unexpected publication configuration; review new build, worker or environment paths');
 assert.deepEqual(config.assets,{directory:'./public'},'publication must use the inspected public directory only');
 assert.equal(config.workers_dev,true,'public anonymous static deployment must remain enabled');
}
function validateRepositoryPath(name){
 assert.ok(!path.isAbsolute(name)&&!path.win32.isAbsolute(name)&&!name.split('/').includes('..'),'repository path must remain local');
 const special=['.gitattributes','.gitignore','.node-version'];
 const extension=path.posix.extname(name);
 assert.ok(special.includes(name)||['.md','.json','.jsonc','.mjs','.js','.css','.html','.png'].includes(extension),'unreviewed repository file type: '+name);
 if(extension==='.png')assert.ok(name.startsWith('public/assets/'),'media outside the recorded asset directory: '+name);
}
function inspectRepositoryFiles(){
 const listing=spawnSync('git',['-c','safe.directory='+root.replaceAll(path.sep,'/'),'ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8',windowsHide:true});
 assert.equal(listing.status,0,'repository inventory requires a readable Git checkout: '+(listing.stderr||listing.error?.message||''));
 const names=[...new Set(listing.stdout.split('\0').filter(Boolean))];let count=0;
 for(const name of names){
  // A missing working file can still have a staged blob. Check its indexed name first.
  validateRepositoryPath(name);
  const file=path.join(root,name);
  if(!fs.existsSync(file))continue;
  assert.ok(!fs.lstatSync(file).isSymbolicLink(),'repository source files must not be symlinks: '+name);
  assert.ok(inside(root,fs.realpathSync(file)),'repository file escaped the project: '+name);
  count++;
 }
 return count;
}
function requireDocumentedSources(result){
 assert.equal(result.unconfirmed.length,0,'publication blocked: unconfirmed asset sources');
 assert.equal(result.upstreamWarnings.length,0,'publication blocked: unconfirmed reference inputs');
}

function validate(record,published){
 assert.equal(record.schemaVersion,1,'unsupported provenance schema');
 assert.ok(Array.isArray(record.assets)&&record.assets.length>0,'asset records are required');
 const byPath=new Map(),documents=new Map();
 for(const asset of record.assets){
  localFile(asset.path,'public/assets');
  assert.equal(path.posix.extname(asset.path),'.png','asset records currently support PNG only');
  assert.ok(!byPath.has(asset.path),'duplicate asset record: '+asset.path);byPath.set(asset.path,asset);
  assert.match(asset.sha256,/^[a-f0-9]{64}$/,'SHA-256 must be lowercase hexadecimal');
  assert.ok(['documented','unconfirmed'].includes(asset.status),'unsupported provenance status');
  assert.ok(Array.isArray(asset.notes)&&asset.notes.length&&asset.notes.every(note=>typeof note==='string'&&note.trim()),'every asset needs honest provenance notes');
  assert.ok(Array.isArray(asset.documents),'asset documents must be an array');
  assert.ok(Array.isArray(asset.referenceAssets),'reference assets must be an array');
  const seenDocuments=new Set();
  for(const document of asset.documents){
   const file=localFile(document.path,'docs');assert.equal(path.posix.extname(document.path),'.md','source records must be Markdown documents');
   assert.ok(['creation-record','audit','indirect-claim'].includes(document.kind),'unsupported source document kind');
   assert.ok(!seenDocuments.has(document.path),'duplicate source document');seenDocuments.add(document.path);
   if(!documents.has(document.path))documents.set(document.path,fs.readFileSync(file,'utf8'));
   if(document.kind==='creation-record')assert.ok(documents.get(document.path).includes(path.posix.basename(asset.path)),'creation record must identify its delivered file: '+asset.path);
  }
  if(asset.status==='documented')assert.ok(asset.documents.some(document=>document.kind==='creation-record'),'documented status requires a creation record');
  assert.equal(new Set(asset.referenceAssets).size,asset.referenceAssets.length,'duplicate reference asset');
  for(const input of asset.referenceAssets)localFile(input,'public/assets');
 }
 assert.deepEqual([...byPath.keys()].sort(),[...published.keys()].sort(),'published PNG inventory must exactly match recorded assets');
 for(const [name,asset] of byPath)assert.equal(published.get(name),asset.sha256,'asset hash changed without updating its provenance: '+name);
 const memo=new Map();
 function unresolvedInputs(name,visiting=new Set()){
  assert.ok(!visiting.has(name),'cyclic provenance dependency');
  if(memo.has(name))return memo.get(name);
  const asset=byPath.get(name);assert.ok(asset,'reference asset is absent from the manifest: '+name);
  const next=new Set(visiting).add(name),unknown=new Set();
  for(const input of asset.referenceAssets){
   const upstream=byPath.get(input);assert.ok(upstream,'reference asset is absent from the manifest: '+input);
   if(upstream.status==='unconfirmed')unknown.add(input);
   for(const inherited of unresolvedInputs(input,next))unknown.add(inherited);
  }
  const result=[...unknown].sort();memo.set(name,result);return result;
 }
 const unconfirmed=record.assets.filter(asset=>asset.status==='unconfirmed').map(asset=>asset.path).sort();
 const upstreamWarnings=record.assets.map(asset=>({asset:asset.path,unconfirmedInputs:unresolvedInputs(asset.path)})).filter(item=>item.unconfirmedInputs.length);
 return {assets:record.assets.length,documented:record.assets.length-unconfirmed.length,unconfirmed,upstreamWarnings};
}

const repositoryFiles=inspectRepositoryFiles();
const config=JSON.parse(fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8'));
validatePublicationConfig(config);
const inventory=discoverPublishedPngs(),published=inventory.pngs,result=validate(manifest,published);
const publishCheck=process.argv.includes('--for-publication');
if(publishCheck)requireDocumentedSources(result);
// Mutation fixtures exercise rejection boundaries without writing to public or
// modifying genuine records. Future additions with honest entries are allowed;
// no assertion depends on today's PNG count or fixed list of unknown sources.
let negativeChecks=0;
const clone=()=>structuredClone(manifest);
function rejects(change,pattern,inventory=published){const candidate=clone();change(candidate);assert.throws(()=>validate(candidate,inventory),pattern);negativeChecks++;}
rejects(record=>record.assets.pop(),/inventory/);
rejects(record=>record.assets.push(structuredClone(record.assets[0])),/duplicate asset/);
rejects(record=>{record.assets[0].sha256='0'.repeat(64);},/hash changed/);
rejects(record=>{record.assets[0].sha256='not-a-hash';},/SHA-256/);
rejects(record=>{record.assets[0].status='copyright-cleared';},/unsupported provenance status/);
rejects(record=>{record.assets[0].notes=[];},/provenance notes/);
rejects(record=>{record.assets[0].status='documented';record.assets[0].documents=[];},/requires a creation record/);
for(const bad of ['../outside.png','public/assets/../outside.png','public/assets//outside.png','C:/outside.png','/tmp/outside.png','public\\assets\\outside.png'])rejects(record=>{record.assets[0].path=bad;},/path|canonical/);
rejects(record=>{record.assets[0].documents=[{path:'docs/../package.json',kind:'creation-record'}];},/path traversal/);
rejects(record=>{record.assets[0].documents=[{path:'public/index.html',kind:'creation-record'}];},/outside its allowed scope/);
rejects(record=>{record.assets[0].documents=[{path:'docs/asset-provenance-nonexistent-record.md',kind:'creation-record'}];},/missing local file/);
rejects(record=>{record.assets[0].documents=[{path:'docs/engine-reference.md',kind:'creation-record'}];},/must identify its delivered file/);
rejects(record=>{record.assets[0].referenceAssets=[record.assets[0].path];},/cyclic/);
const unregistered=new Map(published).set('public/assets/unregistered-fixture.png','f'.repeat(64));
rejects(()=>{},/inventory/,unregistered);
const missing=new Map(published);missing.delete(manifest.assets[0].path);rejects(()=>{},/inventory/,missing);

// Synthetic fixtures exercise the recursive scanner without reading original game data.
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'moonshadow-provenance-'));
try{
 fs.mkdirSync(path.join(fixture,'nested'));
 fs.writeFileSync(path.join(fixture,'index.html'),'<!doctype html><title>fixture</title>');
 assert.equal(discoverPublishedPngs(fixture).fileCount,1);
 const cases=[
  ['music.ogg',Buffer.from('fixture'),/unsupported published file type/],
  ['nested/original.pak',Buffer.from('fixture'),/unsupported published file type/],
  ['nested/archive.zip',Buffer.from('fixture'),/unsupported published file type/],
  ['nested/script.ini',Buffer.from('fixture'),/unsupported published file type/],
  ['nested/dialogue.txt',Buffer.from('fixture'),/unsupported published file type/],
  ['nested/config.json',Buffer.from('{}'),/unsupported published file type/],
  ['nested/image.webp',Buffer.from('fixture'),/unsupported published file type/],
  ['nested/disguised.mjs',Buffer.from([0,1,2]),/binary data/],
  ['nested/invalid.js',Buffer.from([0xff,0xfe]),/UTF-8/],
  ['nested/fake.png',Buffer.from('fixture'),/invalid signature/],
 ];
 for(const [name,bytes,pattern] of cases){
  const file=path.join(fixture,name);fs.writeFileSync(file,bytes);
  assert.throws(()=>discoverPublishedPngs(fixture),pattern);negativeChecks++;fs.unlinkSync(file);
 }
 // Junctions require no symlink privilege on Windows.
 const alias=path.join(fixture,'linked');
 fs.symlinkSync(path.join(fixture,'nested'),alias,process.platform==='win32'?'junction':'dir');
 assert.throws(()=>discoverPublishedPngs(fixture),/symlink/);negativeChecks++;
 assert.throws(()=>discoverPublishedPngs(alias),/root must not be/);negativeChecks++;
 fs.unlinkSync(alias);
}finally{
 assert.equal(path.dirname(path.resolve(fixture)),path.resolve(os.tmpdir()));
 assert.ok(path.basename(fixture).startsWith('moonshadow-provenance-'));
 fs.rmSync(fixture,{recursive:true,force:true});
}
const uncertain=clone();uncertain.assets[0].status='unconfirmed';
assert.throws(()=>requireDocumentedSources(validate(uncertain,published)),/unconfirmed asset sources/);negativeChecks++;
assert.throws(()=>requireDocumentedSources({unconfirmed:[],upstreamWarnings:[{asset:'fixture',unconfirmedInputs:['upstream']}]}),/unconfirmed reference inputs/);negativeChecks++;
requireDocumentedSources({unconfirmed:[],upstreamWarnings:[]});
for(const change of [value=>{value.assets.directory='./work';},value=>{value.env={production:{assets:{directory:'./work'}}};},value=>{value.main='worker.js';},value=>{value.build={command:'copy-original'};}]){
 const candidate=structuredClone(config);change(candidate);assert.throws(()=>validatePublicationConfig(candidate),/publication/);negativeChecks++;
}

for(const name of ['original-reference/script.pak','raw-unpacked/2034.ini','docs/reference/raw-image.png','raw/map.map','raw/npc.npc','raw/voice.wav','raw/source.zip']){
 assert.throws(()=>validateRepositoryPath(name),/unreviewed repository file type|media outside/);negativeChecks++;
}
for(const args of [['--assets','./raw'],['--config','other.json'],['--cwd','..'],['--env','production'],['./raw'],['--dry-run','--assets','./raw'],['--dry-run=false']]){
 assert.throws(()=>deploymentArguments(args),/Only --dry-run/);negativeChecks++;
}
assert.ok(deploymentArguments(['--dry-run']).includes('--dry-run'));
assert.ok(!deploymentArguments([]).includes('--dry-run'));

console.log(JSON.stringify({
 result:'PASS',checked:'publication directory and file types, UTF-8, PNG signatures, inventory, local paths, hashes, documents and input dependencies',
 repositoryFiles,publishedFiles:inventory.fileCount,assets:result.assets,documented:result.documented,negativeChecks,
 publicationCheck:publishCheck?'DOCUMENTED_SOURCES_REQUIRED':'INVENTORY_ONLY',
 sourceCoverage:result.unconfirmed.length||result.upstreamWarnings.length?'INCOMPLETE':'DOCUMENTED_RECORDS_ONLY',
 unconfirmedAssets:result.unconfirmed,unconfirmedReferenceInputs:result.upstreamWarnings,
 note:'PASS仅表示清单一致性检查通过。documented只表示有制作记录；任何列出的未确认来源及上游依赖仍需核实，不证明全部来源完整、法律原创或授权。',
},null,2));
