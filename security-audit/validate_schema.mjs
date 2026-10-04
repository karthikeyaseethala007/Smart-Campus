import fs from 'node:fs';
import path from 'node:path';

const findingsPath = path.resolve(process.cwd(), 'security-audit/findings.json');
const outputPath = path.resolve(process.cwd(), 'security-audit/schema-validation.json');

const raw = fs.readFileSync(findingsPath, 'utf-8');
let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error('JSON Parse Error:', err.message);
  process.exit(1);
}

const errors = [];
const warnings = [];

// Validate scan_metadata
if (!data.scan_metadata) {
  errors.push('Missing scan_metadata object');
} else {
  const meta = data.scan_metadata;
  ['repository', 'timestamp', 'commit', 'scanner', 'summary'].forEach(field => {
    if (!meta[field]) errors.push(`scan_metadata.${field} is missing or empty`);
  });
}

// Validate findings array
if (!Array.isArray(data.findings)) {
  errors.push('findings must be an array');
} else {
  const validSeverities = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']);
  const validStatuses = new Set(['CONFIRMED', 'REJECTED', 'HARDENING', 'UNVERIFIABLE_PHYSICAL']);
  const validConfidences = new Set(['CERTAIN', 'FIRM', 'TENTATIVE']);
  const validExploitabilities = new Set(['HIGH', 'MEDIUM', 'LOW']);

  let counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    informational: 0,
    confirmed: 0,
    rejected: 0,
    hardening: 0,
    physical: 0,
  };

  data.findings.forEach((finding, index) => {
    const prefix = `findings[${index}] (${finding.id || 'unidentified'})`;

    if (!finding.id || typeof finding.id !== 'string') {
      errors.push(`${prefix}: id is missing or not a string`);
    }

    if (!finding.title || typeof finding.title !== 'string') {
      errors.push(`${prefix}: title is missing or not a string`);
    }

    if (!validSeverities.has(finding.severity)) {
      errors.push(`${prefix}: invalid severity '${finding.severity}'`);
    }

    if (!validStatuses.has(finding.status)) {
      errors.push(`${prefix}: invalid status '${finding.status}'`);
    }

    if (!Array.isArray(finding.affected_files) || finding.affected_files.length === 0) {
      errors.push(`${prefix}: affected_files must be a non-empty array`);
    }

    if (!finding.description || typeof finding.description !== 'string') {
      errors.push(`${prefix}: description is missing`);
    }

    if (!finding.evidence || typeof finding.evidence !== 'string') {
      errors.push(`${prefix}: evidence is missing`);
    }

    if (!finding.impact || typeof finding.impact !== 'string') {
      errors.push(`${prefix}: impact is missing`);
    }

    if (!finding.remediation || typeof finding.remediation !== 'string') {
      errors.push(`${prefix}: remediation is missing`);
    }

    if (!validConfidences.has(finding.confidence)) {
      errors.push(`${prefix}: invalid confidence '${finding.confidence}'`);
    }

    if (!validExploitabilities.has(finding.exploitability)) {
      errors.push(`${prefix}: invalid exploitability '${finding.exploitability}'`);
    }

    // Tally
    if (finding.status === 'CONFIRMED') {
      counts.confirmed++;
      if (finding.severity === 'CRITICAL') counts.critical++;
      if (finding.severity === 'HIGH') counts.high++;
      if (finding.severity === 'MEDIUM') counts.medium++;
      if (finding.severity === 'LOW') counts.low++;
      if (finding.severity === 'INFORMATIONAL') counts.informational++;
    } else if (finding.status === 'REJECTED') {
      counts.rejected++;
    } else if (finding.status === 'HARDENING') {
      counts.hardening++;
    } else if (finding.status === 'UNVERIFIABLE_PHYSICAL') {
      counts.physical++;
    }
  });

  // Verify counts match scan_metadata summary
  const summary = data.scan_metadata?.summary || {};
  if (summary.critical !== counts.critical) errors.push(`Summary critical count mismatch: metadata ${summary.critical} vs actual ${counts.critical}`);
  if (summary.high !== counts.high) errors.push(`Summary high count mismatch: metadata ${summary.high} vs actual ${counts.high}`);
  if (summary.medium !== counts.medium) errors.push(`Summary medium count mismatch: metadata ${summary.medium} vs actual ${counts.medium}`);
  if (summary.low !== counts.low) errors.push(`Summary low count mismatch: metadata ${summary.low} vs actual ${counts.low}`);
  if (summary.total_confirmed !== counts.confirmed) errors.push(`Summary confirmed count mismatch: metadata ${summary.total_confirmed} vs actual ${counts.confirmed}`);
  if (summary.total_rejected !== counts.rejected) errors.push(`Summary rejected count mismatch: metadata ${summary.total_rejected} vs actual ${counts.rejected}`);
  if (summary.total_hardening !== counts.hardening) errors.push(`Summary hardening count mismatch: metadata ${summary.total_hardening} vs actual ${counts.hardening}`);
  if (summary.total_physical_unverifiable !== counts.physical) errors.push(`Summary physical count mismatch: metadata ${summary.total_physical_unverifiable} vs actual ${counts.physical}`);
}

const validationResult = {
  isValid: errors.length === 0,
  schema: 'Cloudflare-Security-Audit-Findings-v2',
  validatedAt: new Date().toISOString(),
  targetFile: 'security-audit/findings.json',
  findingsValidated: data.findings?.length || 0,
  errors,
  warnings,
  verifiedCounts: {
    critical: data.scan_metadata?.summary?.critical,
    high: data.scan_metadata?.summary?.high,
    medium: data.scan_metadata?.summary?.medium,
    low: data.scan_metadata?.summary?.low,
    informational: data.scan_metadata?.summary?.informational,
    total_confirmed: data.scan_metadata?.summary?.total_confirmed,
    total_rejected: data.scan_metadata?.summary?.total_rejected,
    total_hardening: data.scan_metadata?.summary?.total_hardening,
    total_physical_unverifiable: data.scan_metadata?.summary?.total_physical_unverifiable,
  },
};

fs.writeFileSync(outputPath, JSON.stringify(validationResult, null, 2), 'utf-8');
console.log(`Schema Validation: ${validationResult.isValid ? 'PASSED' : 'FAILED'} (${errors.length} errors, ${warnings.length} warnings)`);
if (!validationResult.isValid) {
  console.error(errors);
  process.exit(1);
}
