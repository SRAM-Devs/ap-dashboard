// Adjust names and scope signals here as the team's implementation evolves.
const milestone = (label, path, signals) => ({ label, path, signals });
export const roles = [
  { id: 'ui', person: 'Person 1', title: 'Interface & cave', subtitle: 'The experience', color: '#a699ff', paths: ['apps/web/'], milestones: [
    milestone('Target & scope controls', 'apps/web/', ['allowedHosts|allowed_hosts', 'maxDuration|maxRequests|budget']),
    milestone('Cave map & relationships', 'apps/web/', ['ReactFlow|@xyflow|reactflow', 'relationship|edges']),
    milestone('Live activity & findings', 'apps/web/', ['tool.started|tool.completed|agent.message', 'finding']),
    milestone('Evidence detail', 'apps/web/', ['reproduction|remediation', 'artifact|evidenceIds']),
    milestone('Report & export', 'apps/web/', ['report', 'markdown|download']),
    milestone('Lifecycle & cancellation', 'apps/web/', ['cancelling|cancelled', 'cancel']),
    milestone('Snapshot & reconnection', 'apps/web/', ['EventSource|text/event-stream|fetchEventSource', 'lastEventId|Last-Event-ID']),
  ]},
  { id: 'runtime', person: 'Person 2', title: 'Server & agent', subtitle: 'The backbone', color: '#74d9b0', paths: ['apps/server/', 'packages/contracts/', 'pyproject.toml', 'uv.lock', 'README.md', 'scripts/', 'tests/', '.gitignore'], milestones: [
    milestone('Contracts & fixtures', 'packages/contracts/src/', ['class Run|class Asset', 'build_demo_run']),
    milestone('API & SPA hosting', 'apps/server/src/', ['FastAPI', 'StaticFiles|FileResponse']),
    milestone('Persistence & artifacts', 'apps/server/src/', ['sqlite|aiosqlite', 'artifact']),
    milestone('Investigation graph', 'apps/server/src/', ['StateGraph', 'checkpointer|checkpoint']),
    milestone('Durable event publication', 'apps/server/src/', ['tool.started|tool.completed', 'append_event|save_event|persist_event|insert_event']),
    milestone('SSE & message queue', 'apps/server/src/', ['text/event-stream|EventSourceResponse', 'message_queue|messages|queue']),
    milestone('Budgets & cancellation', 'apps/server/src/', ['max_duration|max_requests|deadline', 'cancel']),
    milestone('Tool & report integration', 'apps/server/src/', ['pentester_tools', 'pentester_reporting']),
  ]},
  { id: 'tools', person: 'Person 3', title: 'Discovery & tools', subtitle: 'The fieldwork', color: '#f4c477', paths: ['packages/tools/'], milestones: [
    milestone('Scope enforcement', 'packages/tools/', ['ip_network|ip_address|allowed_hosts|allowedHosts', 'exclusion|allowed_ports|allowedPorts']),
    milestone('Bounded process runner', 'packages/tools/', ['create_subprocess_exec', 'timeout|wait_for', 'terminate|kill']),
    milestone('Nmap discovery', 'packages/tools/', ['nmap', 'ElementTree|xml|fromstring', 'ToolResult']),
    milestone('HTTP inspection', 'packages/tools/', ['httpx|aiohttp|urllib', 'redirect', 'redact|sanitize']),
    milestone('Authorization comparison', 'packages/tools/', ['authoriz|authz|idor', 'account|identity|principal', 'CandidateFinding']),
    milestone('Cancellation & evidence', 'packages/tools/', ['cancel', 'artifact', 'coverage']),
  ]},
  { id: 'report', person: 'Person 4', title: 'Reports & lab', subtitle: 'The proof', color: '#f298b5', paths: ['packages/reporting/', 'lab/'], milestones: [
    milestone('Isolated demo environment', 'lab/', ['services:', 'networks:']),
    milestone('Synthetic authorization target', 'lab/', ['owner|account|user_id', 'vulnerable|idor|authorization|authz']),
    milestone('Finding validation', 'packages/reporting/', ['evidence_ids|evidenceIds', 'retest|fixed', 'reproduction']),
    milestone('Finding deduplication', 'packages/reporting/', ['dedup|duplicate|fingerprint']),
    milestone('JSON & Markdown report', 'packages/reporting/', ['Report|report', 'markdown', 'coverage|limitations']),
    milestone('Reset & demo instructions', 'lab/', ['reset', 'demo|rehears|discover']),
  ]},
];
export function owns(role, file) {
  return role.paths.some(p => p.endsWith('/') ? file.startsWith(p) : file === p);
}
export function estimate(role, files) {
  const milestones = role.milestones.map(m => {
    const evidence = m.signals.map(signal => {
      const regex = new RegExp(signal, 'i');
      return [...files].filter(([path, content]) => path.startsWith(m.path) && regex.test(content)).map(([path]) => path);
    });
    const found = evidence.filter(paths => paths.length).length;
    return { label: m.label, score: Math.round(found / m.signals.length * 100), evidence: [...new Set(evidence.flat())], found, total: m.signals.length };
  });
  // Presence is not correctness: reserve the final 10% for verified integration.
  return { progress: Math.round(milestones.reduce((sum, m) => sum + m.score, 0) / milestones.length * .9), milestones };
}
