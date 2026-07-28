#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const DEFAULT_FILE = 'data/search/compact/repositories_export_part1_007_AI记忆_compact.json';
const DEFAULT_DELAY_MS = 400;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env.local');

dotenv.config({ path: envPath, quiet: true });

function parseArgs(argv) {
  const args = {
    file: DEFAULT_FILE,
    tokenEnv: 'STAR_GITHUB_TOKEN',
    execute: false,
    delayMs: DEFAULT_DELAY_MS,
    limit: 0,
    include: '',
    exclude: '',
    expectedLogin: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--execute') {
      args.execute = true;
    } else if (arg === '--file' || arg === '-f') {
      args.file = next;
      i += 1;
    } else if (arg === '--token-env') {
      args.tokenEnv = next;
      i += 1;
    } else if (arg === '--delay-ms') {
      args.delayMs = Number(next);
      i += 1;
    } else if (arg === '--limit') {
      args.limit = Number(next);
      i += 1;
    } else if (arg === '--include') {
      args.include = next;
      i += 1;
    } else if (arg === '--exclude') {
      args.exclude = next;
      i += 1;
    } else if (arg === '--expected-login') {
      args.expectedLogin = next;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.file) throw new Error('--file cannot be empty');
  if (!Number.isFinite(args.delayMs) || args.delayMs < 0) {
    throw new Error('--delay-ms must be a non-negative number');
  }
  if (!Number.isFinite(args.limit) || args.limit < 0) {
    throw new Error('--limit must be a non-negative number');
  }

  return args;
}

function printHelp() {
  console.log(`
Star GitHub repositories from a search export JSON.

Default input:
  ${DEFAULT_FILE}

Usage:
  node scripts/star-github-repos.mjs
  node scripts/star-github-repos.mjs --execute
  node scripts/star-github-repos.mjs --file data/search/compact/repositories_export_part1_007_AI记忆_compact.json --execute

Options:
  --execute           Actually call GitHub's starring API. Without this, dry-run only.
  --file, -f <path>   JSON export file. Items must include "url" or "name".
  --token-env <name>  Environment variable containing the GitHub token. Default: STAR_GITHUB_TOKEN.
  --expected-login <login>
                      Abort if the token is not authenticated as this GitHub login.
  --delay-ms <n>      Delay between API calls. Default: ${DEFAULT_DELAY_MS}.
  --limit <n>         Star only the first n repositories after filtering.
  --include <text>    Keep repos whose owner/repo or URL includes this text.
  --exclude <text>    Drop repos whose owner/repo or URL includes this text.
  --help, -h          Show this help.

Token:
  Use a GitHub fine-grained token with access to star repositories, or a classic token
  with public_repo scope for public repositories.

Account check:
  Before executing, the script calls GET /user and prints the authenticated account.
  Use --expected-login to make this check strict.
`);
}

function normalizeRepo(repo) {
  const url = String(repo.url || '').trim();
  const name = String(repo.name || '').trim();

  const fromUrl = url.match(/^https:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)\/?$/i);
  if (fromUrl) {
    return {
      owner: fromUrl[1],
      repo: fromUrl[2],
      url,
      language: repo.language || '',
      description: repo.description || '',
    };
  }

  const fromName = name.match(/^([^/\s]+)\s*\/\s*([^/\s]+)$/);
  if (fromName) {
    return {
      owner: fromName[1],
      repo: fromName[2],
      url: `https://github.com/${fromName[1]}/${fromName[2]}`,
      language: repo.language || '',
      description: repo.description || '',
    };
  }

  return null;
}

function uniqueRepos(repos) {
  const seen = new Set();
  const unique = [];

  for (const repo of repos) {
    const normalized = normalizeRepo(repo);
    if (!normalized) continue;

    const key = `${normalized.owner.toLowerCase()}/${normalized.repo.toLowerCase()}`;
    if (seen.has(key)) continue;

    seen.add(key);
    unique.push(normalized);
  }

  return unique;
}

function applyTextFilter(repos, include, exclude) {
  const includeNeedle = include.toLowerCase();
  const excludeNeedle = exclude.toLowerCase();

  return repos.filter((repo) => {
    const haystack = `${repo.owner}/${repo.repo} ${repo.url}`.toLowerCase();
    if (includeNeedle && !haystack.includes(includeNeedle)) return false;
    if (excludeNeedle && haystack.includes(excludeNeedle)) return false;
    return true;
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function starRepo(repo, token) {
  const apiUrl = `https://api.github.com/user/starred/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`;

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Length': '0',
      'User-Agent': 'github-trending-website-star-script',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  const rateRemaining = response.headers.get('x-ratelimit-remaining');
  const rateReset = response.headers.get('x-ratelimit-reset');

  if (response.status === 204) {
    return { ok: true, status: response.status, rateRemaining, rateReset };
  }

  const body = await response.text();
  return {
    ok: false,
    status: response.status,
    rateRemaining,
    rateReset,
    body,
  };
}

async function getAuthenticatedUser(token) {
  const response = await fetch('https://api.github.com/user', {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'github-trending-website-star-script',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`GitHub account check failed: HTTP ${response.status} ${body}`);
  }

  return JSON.parse(body);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(process.cwd(), args.file);
  const raw = await fs.readFile(inputPath, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error(`Expected a JSON array in ${args.file}`);
  }

  let repos = uniqueRepos(data);
  repos = applyTextFilter(repos, args.include, args.exclude);
  if (args.limit > 0) repos = repos.slice(0, args.limit);

  console.log(`Input file: ${args.file}`);
  console.log(`Repositories to process: ${repos.length}`);
  console.log(`Mode: ${args.execute ? 'EXECUTE' : 'DRY RUN'}`);

  const token = process.env[args.tokenEnv];
  if (token) {
    const user = await getAuthenticatedUser(token);
    console.log(`Authenticated GitHub account: ${user.login} (${user.html_url})`);

    if (args.expectedLogin && user.login.toLowerCase() !== args.expectedLogin.toLowerCase()) {
      throw new Error(`Authenticated as ${user.login}, expected ${args.expectedLogin}. Aborting before starring.`);
    }
  } else if (args.execute) {
    throw new Error(`Missing token. Set ${args.tokenEnv} before running with --execute.`);
  } else {
    console.log(`Authenticated GitHub account: not checked (${args.tokenEnv} is not set)`);
  }

  if (!args.execute) {
    for (const [index, repo] of repos.entries()) {
      console.log(`${String(index + 1).padStart(2, '0')}. ${repo.owner}/${repo.repo} (${repo.language || 'Unknown'}) - ${repo.url}`);
    }
    console.log(`\nDry-run only. Add --execute and set ${args.tokenEnv} to star these repositories.`);
    return;
  }

  let success = 0;
  let failed = 0;

  for (const [index, repo] of repos.entries()) {
    const label = `${repo.owner}/${repo.repo}`;
    try {
      const result = await starRepo(repo, token);
      if (result.ok) {
        success += 1;
        console.log(`[${index + 1}/${repos.length}] starred ${label} (rate remaining: ${result.rateRemaining ?? 'unknown'})`);
      } else {
        failed += 1;
        const hint =
          result.status === 404
            ? ' Hint: GitHub returns 404 for this endpoint when the token cannot access the starring API. Check token permissions/scopes.'
            : '';
        console.error(`[${index + 1}/${repos.length}] failed ${label}: HTTP ${result.status} ${result.body || ''}${hint}`);
      }
    } catch (error) {
      failed += 1;
      console.error(`[${index + 1}/${repos.length}] failed ${label}: ${error.message}`);
    }

    if (index < repos.length - 1 && args.delayMs > 0) {
      await sleep(args.delayMs);
    }
  }

  console.log(`\nDone. Starred: ${success}. Failed: ${failed}.`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
