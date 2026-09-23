import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

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
 assert.ok(inside(base,resolved),'resolved path escaped its allowed scope');
 assert.ok(fs.existsSync(resolved),'missing local file: '+relative);
 assert.ok(fs.statSync(resolved).isFile(),'local record must be a file: '+relative);
 // Covers a junction/symlink in a parent directory as well as in the file.
 assert.ok(inside(fs.realpathSync(base),fs.realpathSync(resolved)),'real path escaped its allowed scope');
 return resolved;
}
function discoverPublishedPngs(){
 const files=new Map();
 function walk(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
   const absolute=path.join(directory,entry.name),relative=path.relative(root,absolute).split(path.sep).join('/');
   assert.ok(!entry.isSymbolicLink(),'public symlinks cannot bypass the inventory: '+relative);
   if(entry.isDirectory()){walk(absolute);continue;}
   assert.ok(entry.isFile(),'unexpected public file type: '+relative);
   const png=path.extname(entry.name).toLowerCase()==='.png';
   if(relative.startsWith('public/assets/'))assert.ok(png,'unsupported asset type must be explicitly added to the provenance checker: '+relative);
   if(png)files.set(relative,hash(fs.readFileSync(absolute)));
  }
 }
 walk(path.join(root,'public'));return files;
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

const published=discoverPublishedPngs(),result=validate(manifest,published);
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

console.log(JSON.stringify({
 result:'PASS',checked:'inventory, local paths, file hashes, document links and input dependencies',
 assets:result.assets,documented:result.documented,negativeChecks,
 sourceCoverage:result.unconfirmed.length||result.upstreamWarnings.length?'INCOMPLETE':'DOCUMENTED_RECORDS_ONLY',
 unconfirmedAssets:result.unconfirmed,unconfirmedReferenceInputs:result.upstreamWarnings,
 note:'PASS仅表示清单一致性检查通过。documented只表示有制作记录；任何列出的未确认来源及上游依赖仍需核实，不证明全部来源完整、法律原创或授权。',
},null,2));
