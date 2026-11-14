import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execute = promisify(execFile);
export function createRemoteSync(repo, { interval = 60000 } = {}) {
  let pending, nextAttempt = 0;
  let status = { state: 'pending', lastSuccess: null, failedRemotes: [] };
  const git = async (...args) => (await execute('git', ['-C', repo, ...args], {
    timeout: 20000, maxBuffer: 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never', GIT_SSH_COMMAND: 'ssh -o BatchMode=yes -o ConnectTimeout=10' },
  })).stdout;
  return {
    status: () => ({ ...status }),
    refresh() {
      if (pending) return pending;
      if (Date.now() < nextAttempt) return Promise.resolve(status);
      status = { ...status, state: 'fetching' };
      pending = (async () => {
        try {
          const remotes = (await git('remote')).trim().split('\n').filter(Boolean);
          const failedRemotes = [];
          for (const remote of remotes) {
            try {
              await git('fetch', '--no-tags', '--no-write-fetch-head', '--no-auto-maintenance', '--refmap=', '--', remote,
                `+refs/heads/*:refs/remotes/${remote}/*`);
            } catch { failedRemotes.push(remote); }
          }
          status = { state: !remotes.length ? 'no-remotes' : failedRemotes.length ? 'error' : 'ok',
            lastSuccess: remotes.length && !failedRemotes.length ? new Date().toISOString() : status.lastSuccess, failedRemotes };
        } catch { status = { ...status, state: 'error' }; }
        finally { nextAttempt = Date.now() + interval; pending = null; }
        return status;
      })();
      return pending;
    },
  };
}
