import { describe, expect, it } from 'vitest';

import { enrichDefaultLocaleManifest, normalizeReleaseNotes } from './enrich-winget-manifest.mjs';

describe('enrich-winget-manifest', () => {
  it('normalizeReleaseNotes strips markdown while keeping structure', () => {
    const normalized = normalizeReleaseNotes(`
## What's Changed

- **Feature:** Added [WinGet support](https://example.com)
1. Fixed \`race condition\`
> Note from maintainer
`);

    expect(normalized).toBe(
      [
        "What's Changed",
        '',
        '- Feature: Added WinGet support (https://example.com)',
        '- Fixed race condition',
        'Note from maintainer',
      ].join('\n'),
    );
  });

  it('normalizeReleaseNotes wraps long bullet lines to keep them readable', () => {
    const normalized = normalizeReleaseNotes(`
- This is a deliberately long bullet line that should wrap before it becomes too wide for WinGet locale manifest guidance.
`);

    const lines = normalized.split('\n');
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => line.length <= 100)).toBe(true);
    expect(lines[0]).toMatch(/^- /);
    expect(lines[1]).toMatch(/^  /);
  });

  it('enrichDefaultLocaleManifest replaces release fields before ManifestType', () => {
    const manifest = [
      'PackageIdentifier: fjrevoredo.MiniDiarium',
      'PackageVersion: 0.4.8',
      'PackageLocale: en-US',
      'Publisher: Francisco Revoredo',
      'ReleaseNotesUrl: https://old.example.com',
      'ManifestType: defaultLocale',
      'ManifestVersion: 1.12.0',
      '',
    ].join('\n');

    const enriched = enrichDefaultLocaleManifest(manifest, {
      releaseNotes: 'Line one\nLine two',
      releaseNotesUrl: 'https://github.com/fjrevoredo/mini-diarium/releases/tag/v0.4.8',
    });

    expect(enriched).toMatch(
      /ReleaseNotes: \|-\n  Line one\n  Line two\nReleaseNotesUrl: https:\/\/github.com\/fjrevoredo\/mini-diarium\/releases\/tag\/v0\.4\.8\nManifestType: defaultLocale/,
    );
    expect(enriched).not.toMatch(/https:\/\/old\.example\.com/);
  });
});
