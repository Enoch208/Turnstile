import { readFile, writeFile } from "node:fs/promises";

const DATA_URL = new URL("../frontend/content/readiness.json", import.meta.url);
const SIGNALS_URL = new URL("../frontend/content/readiness-signals.json", import.meta.url);

const HEADERS = {
  "User-Agent": "turnstile-readiness-check",
  Accept: "application/vnd.github+json",
};
if (process.env.GITHUB_TOKEN) {
  HEADERS.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return { error: `api ${response.status}` };
  return response.json();
}

async function checkRelease(owner, repo, tag) {
  const latest = await github(`/repos/${owner}/${repo}/releases/latest`);
  if (latest.error) return { kind: "release", state: latest.error };
  return {
    kind: "release",
    state:
      latest.tag_name === tag ? `latest is still ${tag}` : `superseded by ${latest.tag_name}`,
  };
}

async function checkPull(owner, repo, number) {
  const pull = await github(`/repos/${owner}/${repo}/pulls/${number}`);
  if (pull.error) return { kind: "pull", state: pull.error };
  if (pull.merged_at) return { kind: "pull", state: `merged ${pull.merged_at.slice(0, 10)}` };
  return { kind: "pull", state: pull.draft ? "open draft" : pull.state };
}

async function checkIssue(owner, repo, number) {
  const issue = await github(`/repos/${owner}/${repo}/issues/${number}`);
  if (issue.error) return { kind: "issue", state: issue.error };
  return { kind: "issue", state: issue.state };
}

async function checkPage(source) {
  try {
    const response = await fetch(source, {
      headers: { "User-Agent": HEADERS["User-Agent"] },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    return { kind: "page", state: response.ok ? "reachable" : `http ${response.status}` };
  } catch {
    return { kind: "page", state: "unreachable" };
  }
}

const ROUTES = [
  [
    /github\.com\/([^/]+)\/([^/]+)\/releases\/tag\/([^/?#]+)/,
    (m) => checkRelease(m[1], m[2], decodeURIComponent(m[3])),
  ],
  [/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/, (m) => checkPull(m[1], m[2], m[3])],
  [/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/, (m) => checkIssue(m[1], m[2], m[3])],
];

function checkSource(source) {
  for (const [pattern, run] of ROUTES) {
    const match = source.match(pattern);
    if (match) return run(match);
  }
  return checkPage(source);
}

const { entries } = JSON.parse(await readFile(DATA_URL, "utf8"));
const sourced = entries.filter((entry) => entry.source);

const results = await Promise.all(
  sourced.map(async (entry) => ({
    name: entry.name,
    source: entry.source,
    ...(await checkSource(entry.source)),
  })),
);
results.sort((a, b) => a.name.localeCompare(b.name));

const signals = {
  checkedAt: new Date().toISOString(),
  polled: results.length,
  unpollable: entries.length - sourced.length,
  results,
};

await writeFile(SIGNALS_URL, `${JSON.stringify(signals, null, 2)}\n`);

for (const result of results) {
  console.log(`${result.name.padEnd(24)} ${result.kind.padEnd(8)} ${result.state}`);
}
console.log(
  `\n${results.length} sources polled; ${signals.unpollable} rows have no public statement to poll.`,
);
