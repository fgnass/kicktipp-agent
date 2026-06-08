import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { detectAlternateSite } from '../src/helpers/detect-site.js';

const content = (inner: string) =>
  cheerio.load(`<div id="kicktipp-content">${inner}</div>`);

describe('detectAlternateSite', () => {
  it('detects a community that actually lives on kicktipp.de when viewed on .com', () => {
    const $ = content(
      `<p>This predictor game is available in the following languages:</p>
       <div class="menu"><a href="https://www.kicktipp.de/liotipp-26/">German</a></div>`,
    );
    expect(detectAlternateSite($, 'liotipp-26', 'com')).toBe('de');
  });

  it('detects a .com community when viewed on .de', () => {
    const $ = content(`<a href="https://www.kicktipp.com/world-pool/">English</a>`);
    expect(detectAlternateSite($, 'world-pool', 'de')).toBe('com');
  });

  it('returns null on a normal page (no cross-domain link)', () => {
    const $ = content(
      `<table id="ranking"><tbody><tr><td><div class="mg_name">Felix</div></td></tr></tbody></table>
       <a href="/liotipp-26/profil/sprache">de</a>`,
    );
    expect(detectAlternateSite($, 'liotipp-26', 'de')).toBeNull();
  });

  it('ignores a same-site absolute link to the current domain', () => {
    // current = de, a link to kicktipp.de/<community> is NOT the alternate site
    const $ = content(`<a href="https://www.kicktipp.de/liotipp-26/tippuebersicht">Tippübersicht</a>`);
    expect(detectAlternateSite($, 'liotipp-26', 'de')).toBeNull();
  });

  it('does not match a different community on the other domain', () => {
    const $ = content(`<a href="https://www.kicktipp.com/other-pool/">x</a>`);
    expect(detectAlternateSite($, 'liotipp-26', 'de')).toBeNull();
  });
});
