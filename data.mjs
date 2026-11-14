import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, lstat } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { roles, owns, estimate } from './scope.mjs';
const execute = promisify(execFile);
export const repo = resolve(process.env.REPO_PATH || new URL('../agentic-pentester', import.meta.url).pathname);
const git = async (...args) => (await execute('git', ['-C', repo, ...args], { timeout: 15000, maxBuffer: 16 * 1024 * 1024, env: {...process.env, GIT_OPTIONAL_LOCKS:'0'} })).stdout;
export function parseLog(raw) {
  return raw.split('\x1e').filter(s => s.trim()).map(record => {
    const [header, ...paths] = record.trim().split('\n');
    const [hash, author, date, subject] = header.split('\x1f');
    return {hash, author, date, subject, paths: paths.map(p => p.trim()).filter(Boolean)};
  });
}
export async function snapshot() {
  const [raw, listed, changed, branch, refs] = await Promise.all([
    git('log', '--all', '--no-merges', '--date-order', '--format=%x1e%H%x1f%an%x1f%cI%x1f%s', '--name-only'),
    git('ls-files', '-z', '--cached', '--others', '--exclude-standard'),
    git('status', '--porcelain=v1', '-z', '--untracked-files=all'),
    git('rev-parse', '--abbrev-ref', 'HEAD'),
    git('for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes'),
  ]);
  const commits = parseLog(raw);
  const paths = [...new Set(listed.split('\0').filter(Boolean))];
  const files = new Map();
  await Promise.all(paths.filter(p => /\.(py|tsx?|jsx?|ya?ml|sh|md)$/.test(p) && !/(^|\/)(tests?|fixtures|generated|node_modules|dist|\.venv)(\/|\.)/.test(p) && !/(^|\/)(test_|.*\.test\.|.*\.spec\.)/.test(p) && roles.some(r => owns(r,p))).map(async path => {
    const full = resolve(repo, path), rel = relative(repo, full);
    if (rel.startsWith('..') || isAbsolute(rel)) return;
    try { const stat = await lstat(full); if (stat.isFile() && stat.size < 400000) files.set(path, await readFile(full, 'utf8')); } catch { /* Concurrent edits can remove files between reads. */ }
  }));
  const dirty = [];
  const entries = changed.split('\0');
  for (let i=0; i<entries.length; i++) {
    if (!entries[i]) continue;
    const status = entries[i].slice(0,2), path = entries[i].slice(3);
    dirty.push(path);
    if (/[RC]/.test(status)) i++;
  }
  const now = Date.now();
  const people = roles.map(role => {
    const activity = commits.filter(c => c.paths.some(p => owns(role,p)));
    return {...role, ...estimate(role,files), commits: activity.length, recentCommits: activity.filter(c => now-Date.parse(c.date)<3600000).length,
      changedFiles: dirty.filter(p=>owns(role,p)).length, sourceFiles: [...files.keys()].filter(p=>owns(role,p)).length,
      lastCommit: activity[0] || null, history: Array.from({length:24},(_,i)=> activity.filter(c=> {const hours=(now-Date.parse(c.date))/3600000;return hours>=23-i && hours<24-i;}).length)};
  });
  return {updatedAt:new Date().toISOString(), repo, branch:branch.trim(), refs:refs.trim().split('\n').filter(Boolean), people,
    totalCommits:commits.length, recentCommits:commits.filter(c=>now-Date.parse(c.date)<3600000).length,
    progress:Math.round(people.reduce((s,p)=>s+p.progress,0)/people.length), changedFiles:dirty.length,
    activity:commits.slice(0,12).map(c=>({...c, roles:roles.filter(r=>c.paths.some(p=>owns(r,p))).map(r=>r.id)}))};
}
