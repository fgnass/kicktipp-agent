import * as cheerio from 'cheerio';
import { KicktippSite, siteBase } from '../url.js';

/**
 * When a community is opened on the wrong site, kicktipp serves a "this game is
 * available in the following languages" page that links to the SAME community on
 * the other domain (e.g. https://www.kicktipp.de/<community>/). Detecting that
 * cross-domain link tells us which site the community actually lives on.
 *
 * Returns the alternate site if the page points there, otherwise null.
 */
export function detectAlternateSite(
  $: cheerio.CheerioAPI,
  community: string,
  current: KicktippSite,
): KicktippSite | null {
  const other: KicktippSite = current === 'de' ? 'com' : 'de';
  const prefix = `${siteBase(other)}/${community}`;

  let found = false;
  $('#kicktipp-content a').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith(prefix)) found = true;
  });

  return found ? other : null;
}
