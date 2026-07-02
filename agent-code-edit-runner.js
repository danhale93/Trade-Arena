/**
 * agent-code-edit-runner.js
 *
 * Server-side code editing workflow intended for a UI/LLM agent.
 *
 * Design goals:
 * - Never allow client-side arbitrary filesystem writes.
 * - Only apply diffs produced for allow-listed files.
 * - Verify before/after applying.
 * - Maintain audit logs.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE_ROOT = __dirname;
const AUDIT_DIR = path.join(WORKSPACE_ROOT, '.agent_audit');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function normalizeRequestedScopes(scopes) {
  if (!scopes) return [];
  if (!Array.isArray(scopes)) return [scopes];
  return scopes.filter(Boolean);
}

function defaultAllowlist() {
  // Conservative default allowlist. Since your choice is (B) source edits,
  // we still require explicit scope(s) from the request.
  return [
    'server.js',
    'contract-helpers.js',
    'app.js',
    'trading-engine.js',
    'music-player.js'
  ];
}

function isSecretPath(p) {
  const badFragments = [
    '.env',
    '.blackboxrules',
    'private_key',
    'PRIVATE_KEY',
    'apikey',
    'API_KEY'
  ];
  return badFragments.some(f => p.includes(f));
}

function resolveAndValidatePaths({ diffText, scopes }) {
  // Very lightweight safety check.
  // We parse unified diff headers and collect touched file paths.
  // git apply uses paths like "a/server.js" / "b/server.js".

  const touched = new Set();
  const lines = diffText.split(/\r?\n/);
  for (const line of lines) {
    // Example: --- a/server.js
    // Example: +++ b/server.js
    const m = /^(---|\+\+\+)\s+(a\/|b\/)?(.*)$/.exec(line);
    if (!m) continue;
    const raw = m[3];
    if (!raw) continue;
    if (raw === '/dev/null') continue;
    // Ignore timestamps/metadata; assume file path.
    const candidate = raw.replace(/^"|"$/g, '');
    // If diff contains directories, keep as-is.
    touched.add(candidate);
  }

  const touchedList = [...touched].filter(p => !p.includes('@@'));

  const allow = new Set(defaultAllowlist().map(x => x.replace(/^.*?\//, '')));
  const requested = new Set(normalizeRequestedScopes(scopes).map(s => String(s).replace(/^.*?\//, '')));

  // If requested scopes is empty, refuse.
  if (requested.size === 0) {
    return {
      ok: false,
      error: 'No scopes provided. Refusing to apply diff.'
    };
  }

  // Enforce: every touched file must be within allowlist AND within requested scopes.
  for (const f of touchedList) {
    const base = f.replace(/^.*?\//, '');
    if (isSecretPath(base)) {
      return { ok: false, error: `Refusing to edit secret path: ${base}` };
    }
    if (!allow.has(base)) {
      return { ok: false, error: `Touched file not in default allowlist: ${base}` };
    }
    if (!requested.has(base)) {
      return { ok: false, error: `Touched file not in requested scopes: ${base}` };
    }
  }

  return { ok: true, touched: touchedList };
}

function verifyFilesSyntax(files) {
  // Node syntax check only. Quick and deterministic.
  const results = {};
  for (const file of files) {
    const base = file.replace(/^.*?\//, '');
    if (!base) continue;
    const fullPath = path.join(WORKSPACE_ROOT, base);
    if (!fs.existsSync(fullPath)) {
      results[base] = { ok: false, error: 'File not found' };
      continue;
    }

    try {
      execSync(`node -c "${fullPath}"`, { stdio: 'pipe' });
      results[base] = { ok: true };
    } catch (e) {
      results[base] = { ok: false, error: String(e.stderr || e.message || e) };
    }
  }
  return results;
}

function gitHasRepo() {
  return fs.existsSync(path.join(WORKSPACE_ROOT, '.git'));
}

function revertByGitCheckout(files) {
  if (!gitHasRepo()) {
    return { ok: false, error: 'No .git directory; cannot rollback.' };
  }
  // Checkout specific paths.
  try {
    const quoted = files.map(f => `"${path.join(WORKSPACE_ROOT, f.replace(/^.*?\//, ''))}"`).join(' ');
    // Use git checkout -- <path>
    execSync(`git checkout -- ${files.map(f => f.replace(/^.*?\//, '')).map(f => `"${f}"`).join(' ')}`, { stdio: 'pipe' });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e.stderr || e.message || e) };
  }
}

function applyDiffWithGit(diffText) {
  if (!gitHasRepo()) {
    // Fallback: still refuse; applying raw diffs is unsafe.
    return { ok: false, error: 'No .git repo; refusing to apply diff.' };
  }

  const patchPath = path.join(WORKSPACE_ROOT, '.agent_tmp.patch');
  fs.writeFileSync(patchPath, diffText, 'utf8');

  try {
    execSync(`git apply --whitespace=nowarn "${patchPath}"`, { stdio: 'pipe' });
    fs.unlinkSync(patchPath);
    return { ok: true };
  } catch (e) {
    try { fs.unlinkSync(patchPath); } catch (_) {}
    return { ok: false, error: String(e.stderr || e.message || e) };
  }
}

function writeAudit({ auditId, requestHash, diffHash, prompt, diffText, scopes, touchedFiles, verification, outcome }) {
  ensureDir(AUDIT_DIR);
  const rec = {
    auditId,
    requestHash,
    diffHash,
    timestamp: Date.now(),
    scopes,
    touchedFiles,
    verification,
    outcome,
    promptPreview: String(prompt).slice(0, 4000),
    diffPreview: String(diffText).slice(0, 4000)
  };
  fs.writeFileSync(path.join(AUDIT_DIR, `${auditId}.json`), JSON.stringify(rec, null, 2), 'utf8');
  return rec;
}

function loadAudit(auditId) {
  const p = path.join(AUDIT_DIR, `${auditId}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// NOTE: LLM calling is intentionally stubbed.
// You can plug in your provider here.
async function generateDiffFromLLM({ agentRequest, scopes }) {
  // This stub returns a placeholder to keep the system wiring working.
  // In production, replace with actual LLM call.
  const diff = [
    '*** STUB DIFF - NO CHANGES APPLIED ***',
    'System: Implement your LLM provider to output a unified diff.'
  ].join('\n');

  return {
    diffText: diff,
    warnings: ['LLM diff generation not configured.']
  };
}

async function planEdit({ agentRequest, scopes }) {
  const requestHash = sha256(JSON.stringify({ agentRequest, scopes }));
  // LLM prompt generation intentionally minimal; real implementation should include:
  // - allowlist + policy
  // - file-by-file instructions
  // - diff-only output
  const prompt = {
    task: agentRequest,
    constraints: {
      allowedFiles: normalizeRequestedScopes(scopes),
      mustNotTouch: ['.env', '.blackboxrules', 'PRIVATE_KEY', 'API_KEY']
    }
  };

  const { diffText, warnings } = await generateDiffFromLLM({ agentRequest, scopes });
  const diffHash = sha256(diffText);

  // Identify touched files from diff so UI can show preview.
  const pathCheck = resolveAndValidatePaths({ diffText, scopes });

  return {
    auditId: sha256(requestHash + ':' + Date.now().toString()).slice(0, 16),
    requestHash,
    diffHash,
    diffPreview: diffText.slice(0, 6000),
    policyWarnings: warnings || [],
    touchedFiles: pathCheck.ok ? pathCheck.touched : [],
    policyStatus: pathCheck.ok ? 'OK' : 'BLOCKED',
    policyError: pathCheck.ok ? null : pathCheck.error,
    prompt
  };
}

async function applyPlannedEdit({ diffText, scopes, auditId, requestHash }) {
  const diffHash = sha256(diffText);

  // Validate diff against policy.
  const pathCheck = resolveAndValidatePaths({ diffText, scopes });
  if (!pathCheck.ok) {
    return {
      ok: false,
      audit: writeAudit({
        auditId,
        requestHash,
        diffHash,
        prompt: 'N/A',
        diffText,
        scopes,
        touchedFiles: [],
        verification: null,
        outcome: { ok: false, error: pathCheck.error }
      }),
      error: pathCheck.error
    };
  }

  const touchedFiles = pathCheck.touched.map(f => f.replace(/^.*?\//, ''));

  // Verify pre-state (syntax) quickly.
  const pre = verifyFilesSyntax(touchedFiles);

  const applyRes = applyDiffWithGit(diffText);
  if (!applyRes.ok) {
    return {
      ok: false,
      audit: writeAudit({
        auditId,
        requestHash,
        diffHash,
        prompt: 'N/A',
        diffText,
        scopes,
        touchedFiles,
        verification: { pre },
        outcome: { ok: false, error: applyRes.error }
      }),
      error: applyRes.error
    };
  }

  // Verify after apply.
  const post = verifyFilesSyntax(touchedFiles);
  const postOk = Object.values(post).every(r => r.ok);

  if (!postOk) {
    // Roll back
    const rollback = revertByGitCheckout(touchedFiles);
    return {
      ok: false,
      audit: writeAudit({
        auditId,
        requestHash,
        diffHash,
        prompt: 'N/A',
        diffText,
        scopes,
        touchedFiles,
        verification: { pre, post, rollback },
        outcome: { ok: false, error: 'Verification failed after applying diff' }
      }),
      error: 'Verification failed after applying diff'
    };
  }

  return {
    ok: true,
    audit: writeAudit({
      auditId,
      requestHash,
      diffHash,
      prompt: 'N/A',
      diffText,
      scopes,
      touchedFiles,
      verification: { pre, post },
      outcome: { ok: true }
    })
  };
}

module.exports = {
  planEdit,
  applyPlannedEdit,
  loadAudit
};
