import { describe, it, expect, afterEach } from 'vitest';
import {
  getSite,
  getPredictUrl,
  getLeaderboardUrl,
  getScheduleUrl,
  getOverviewUrl,
  getTableUrl,
  getRulesUrl,
  getBonusUrl,
  getLoginUrl,
} from '../src/url.js';

afterEach(() => {
  delete process.env.KICKTIPP_SITE;
});

describe('site selection', () => {
  it('defaults to the German site', () => {
    delete process.env.KICKTIPP_SITE;
    expect(getSite()).toBe('de');
  });

  it('honours KICKTIPP_SITE=com', () => {
    process.env.KICKTIPP_SITE = 'com';
    expect(getSite()).toBe('com');
  });

  it('falls back to de for unknown values', () => {
    process.env.KICKTIPP_SITE = 'nonsense';
    expect(getSite()).toBe('de');
  });
});

describe('German routes (kicktipp.de)', () => {
  it('builds community URLs with German segments', () => {
    process.env.KICKTIPP_SITE = 'de';
    expect(getPredictUrl('mycomm')).toBe('https://www.kicktipp.de/mycomm/tippabgabe');
    expect(getPredictUrl('mycomm', 5)).toBe('https://www.kicktipp.de/mycomm/tippabgabe?spieltagIndex=5');
    expect(getLeaderboardUrl('mycomm')).toBe('https://www.kicktipp.de/mycomm/tippuebersicht');
    expect(getScheduleUrl('mycomm')).toBe('https://www.kicktipp.de/mycomm/tippspielplan');
    expect(getOverviewUrl('mycomm', 'spieltagspunkte')).toBe('https://www.kicktipp.de/mycomm/gesamtuebersicht?ansicht=spieltagspunkte');
    expect(getTableUrl('mycomm')).toBe('https://www.kicktipp.de/mycomm/tabellen');
    expect(getTableUrl('mycomm', 'heim')).toBe('https://www.kicktipp.de/mycomm/tabellen?option=heim');
    expect(getRulesUrl('mycomm')).toBe('https://www.kicktipp.de/mycomm/spielregeln');
    expect(getBonusUrl('mycomm')).toBe('https://www.kicktipp.de/mycomm/tippabgabe?bonus=true');
    expect(getLoginUrl()).toBe('https://www.kicktipp.de/info/profil/login');
  });
});

describe('English routes (kicktipp.com)', () => {
  it('builds community URLs with English segments', () => {
    process.env.KICKTIPP_SITE = 'com';
    expect(getPredictUrl('mycomm')).toBe('https://www.kicktipp.com/mycomm/predict');
    expect(getPredictUrl('mycomm', 5)).toBe('https://www.kicktipp.com/mycomm/predict?spieltagIndex=5');
    expect(getLeaderboardUrl('mycomm', undefined, true)).toBe('https://www.kicktipp.com/mycomm/leaderboard?bonus=true');
    expect(getScheduleUrl('mycomm')).toBe('https://www.kicktipp.com/mycomm/schedule');
    expect(getOverviewUrl('mycomm', 'spieltagspunkte')).toBe('https://www.kicktipp.com/mycomm/overview?ansicht=spieltagspunkte');
    expect(getTableUrl('mycomm', 'gast')).toBe('https://www.kicktipp.com/mycomm/tables?option=gast');
    expect(getRulesUrl('mycomm')).toBe('https://www.kicktipp.com/mycomm/rules');
    expect(getBonusUrl('mycomm')).toBe('https://www.kicktipp.com/mycomm/predict?bonus=true');
    expect(getLoginUrl()).toBe('https://www.kicktipp.com/info/profil/login');
  });
});

describe('matchday validation', () => {
  it('throws on invalid matchday', () => {
    expect(() => getPredictUrl('mycomm', 42)).toThrow();
    expect(() => getPredictUrl('mycomm', 0)).toThrow();
    expect(() => getScheduleUrl('mycomm', 99)).toThrow();
  });
});
