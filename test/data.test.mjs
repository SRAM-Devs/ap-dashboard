import test from 'node:test';
import assert from 'node:assert/strict';
import {roles, owns, estimate} from '../scope.mjs';
import {parseLog} from '../data.mjs';
test('ownership matches path boundaries and exact root files',()=>{assert(owns(roles[0],'apps/web/src/App.tsx'));assert(!owns(roles[0],'apps/website/a'));assert(owns(roles[1],'uv.lock'));assert(!owns(roles[1],'uv.lock.backup'));});
test('commit records retain paths for multi-owner attribution',()=>{const [c]=parseLog('\x1eabc\x1fDev\x1f2026-11-14T10:00:00Z\x1ffeat: demo\n\napps/web/a.ts\npackages/tools/a.py\n');assert.equal(c.subject,'feat: demo');assert.deepEqual(roles.filter(r=>c.paths.some(p=>owns(r,p))).map(r=>r.id),['ui','tools']);assert.deepEqual(parseLog(''),[]);});
test('missing code earns zero and unrelated scope is ignored',()=>{assert.equal(estimate(roles[0],new Map()).progress,0);assert.equal(estimate(roles[0],new Map([['lab/example.ts','EventSource lastEventId']])).progress,0);});
test('partial evidence is fractional and full signals reserve integration margin',()=>{const role={milestones:[{label:'Example',path:'src/',signals:['one','two']}]};assert.equal(estimate(role,new Map([['src/a.py','one']])).progress,45);const full=estimate(role,new Map([['src/a.py','one two']]));assert.equal(full.progress,90);assert.deepEqual(full.milestones[0].evidence,['src/a.py']);});
