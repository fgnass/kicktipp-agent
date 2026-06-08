import { loadSite } from './config.js';

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

export function getSite(): KicktippSite {
  const raw = (loadSite() || 'de').toLowerCase();
  return raw === 'com' ? 'com' : 'de';
}

function profile(): SiteProfile {
  return SITES[getSite()];
}

export function getBaseUrl(): string {
  return profile().base;
}

export function getLoginUrl(): string {
  return `${profile().base}/info/profil/login`;
}

export function getMyCommunitiesUrl(): string {
  return `${profile().base}/info/profil/meinetipprunden`;
}

type RouteKey = keyof SiteProfile['routes'];

function communityRoute(community: string, route: RouteKey): string {
  const p = profile();
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
