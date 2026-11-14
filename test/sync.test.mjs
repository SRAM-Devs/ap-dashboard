import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRemoteSync} from '../sync.mjs';
test('fetches every branch even from a single-branch clone, deduplicates shared history, preserves working files', async()=>{
 const root=await mkdtemp(join(tmpdir(),'dashboard-sync-'));
 const source=join(root,'source'), checkout=join(root,'checkout');
 const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try {
  execFileSync('git',['init','-b','main',source],{stdio:'ignore'});
  git(source,'config','commit.gpgsign','false');git(source,'config','user.name','Test');git(source,'config','user.email','test@example.com');
  await writeFile(join(source,'base'),'base');git(source,'add','.');git(source,'commit','-m','shared');
  execFileSync('git',['clone','--single-branch',source,checkout],{stdio:'ignore'});
  for(const branch of ['ui','tools']){git(source,'checkout','-b',branch,'main');await writeFile(join(source,branch),branch);git(source,'add','.');git(source,'commit','-m',branch);}
  await writeFile(join(checkout,'base'),'unfinished local edit');
  const sync=createRemoteSync(checkout);
  const [result]=await Promise.all([sync.refresh(),sync.refresh()]);
  assert.equal(result.state,'ok');assert(result.lastSuccess);
  assert.equal(git(checkout,'rev-list','--all','--count'),'3');
  assert.match(git(checkout,'branch','-r'),/origin\/ui/);assert.match(git(checkout,'branch','-r'),/origin\/tools/);
  assert.equal(git(checkout,'branch','--show-current'),'main');assert.match(git(checkout,'diff'),/unfinished local edit/);
  git(checkout,'remote','set-url','origin',join(root,'missing'));
  assert.equal((await createRemoteSync(checkout).refresh()).state,'error');
  assert.equal(git(checkout,'rev-list','--all','--count'),'3');
 }finally{await rm(root,{recursive:true,force:true});}
});
