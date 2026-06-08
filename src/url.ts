import { loadSite, loadSiteForCommunity } from './config.js';

// kicktipp serves the same game under two sites with different route names:
//  - kicktipp.de uses German segments (tippabgabe, tippuebersicht, ...)
//  - kicktipp.com uses English segments (predict, leaderboard, ...)
// A community only renders on the site matching its language, so the whole
// route set (base URL + segment names) is selected together via a "site profile".

export type KicktippSite = 'de' | 'com';

interface SiteProfile {
  base: string;
  routes: {
    predict: string;
    leaderboard: string;
    schedule: string;
    overview: string;
    tables: string;
    rules: string;
  };
}

const SITES: Record<KicktippSite, SiteProfile> = {
  de: {
    base: 'https://www.kicktipp.de',
    routes: {
      predict: 'tippabgabe',
      leaderboard: 'tippuebersicht',
      schedule: 'tippspielplan',
      overview: 'gesamtuebersicht',
      tables: 'tabellen',
      rules: 'spielregeln',
    },
  },
  com: {
    base: 'https://www.kicktipp.com',
    routes: {
      predict: 'predict',
      leaderboard: 'leaderboard',
      schedule: 'schedule',
      overview: 'overview',
      tables: 'tables',
      rules: 'rules',
    },
  },
};

function normalizeSite(raw: string | null): KicktippSite {
  return (raw || 'de').toLowerCase() === 'com' ? 'com' : 'de';
}

/**
 * The site to use. Pass a community to get its resolved (possibly auto-detected)
 * site; omit it for the global/default site (used before a community is known).
 */
export function getSite(community?: string): KicktippSite {
  return normalizeSite(community ? loadSiteForCommunity(community) : loadSite());
}

export function siteBase(site: KicktippSite): string {
  return SITES[site].base;
}

export function getBaseUrl(): string {
  return SITES[getSite()].base;
}

export function getLoginUrl(site?: KicktippSite): string {
  return `${SITES[site ?? getSite()].base}/info/profil/login`;
}

export function getMyCommunitiesUrl(): string {
  return `${SITES[getSite()].base}/info/profil/meinetipprunden`;
}

type RouteKey = keyof SiteProfile['routes'];

function communityRoute(community: string, route: RouteKey): string {
  const p = SITES[getSite(community)];
  return `${p.base}/${encodeURIComponent(community)}/${p.routes[route]}`;
}

function assertMatchday(matchday: number): void {
  if (matchday < 1 || matchday > 34) {
    throw new RangeError(`The matchday '${matchday}' is not valid, use only 1 to 34!`);
  }
}

export function getPredictUrl(community: string, matchday?: number): string {
  const base = communityRoute(community, 'predict');
  if (matchday === undefined) return base;
  assertMatchday(matchday);
  return `${base}?spieltagIndex=${matchday}`;
}

export function getBonusUrl(community: string): string {
  return `${communityRoute(community, 'predict')}?bonus=true`;
}

export function getLeaderboardUrl(
  community: string,
  matchday?: number,
  bonus = false,
): string {
  const params: string[] = [];
  if (bonus) params.push('bonus=true');
  if (matchday !== undefined) {
    assertMatchday(matchday);
    params.push(`spieltagIndex=${matchday}`);
  }
  const base = communityRoute(community, 'leaderboard');
  return params.length ? `${base}?${params.join('&')}` : base;
}

export function getScheduleUrl(community: string, matchday?: number): string {
  const base = communityRoute(community, 'schedule');
  if (matchday === undefined) return base;
  assertMatchday(matchday);
  return `${base}?spieltagIndex=${matchday}`;
}

export function getOverviewUrl(community: string, ansicht: string): string {
  return `${communityRoute(community, 'overview')}?ansicht=${encodeURIComponent(ansicht)}`;
}

export function getTableUrl(community: string, option?: 'heim' | 'gast'): string {
  const base = communityRoute(community, 'tables');
  return option ? `${base}?option=${option}` : base;
}

export function getRulesUrl(community: string): string {
  return communityRoute(community, 'rules');
}
