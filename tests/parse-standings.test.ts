import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { parseStandings } from '../src/helpers/parse-standings.js';

// kicktipp renders the same "sporttabelle" widget for every competition:
// columns are Sp | Pkt | Tore (combined "x:y") | Diff | g | u | v.
// A league shows one table; a group-stage tournament shows several.
function standingsTable(name: string, rows: [string, string, string, string, string, string, string, string][]): string {
  const body = rows
    .map(
      ([pos, team, sp, pkt, tore, diff, g, u, v]) =>
        `<tr><td>${pos}</td><td>${team}</td><td>${sp}</td><td>${pkt}</td><td>${tore}</td><td>${diff}</td><td>${g}</td><td>${u}</td><td>${v}</td></tr>`,
    )
    .join('');
  return `<table class="sporttabelle drei_punkte_regel ktable">
    <thead><tr><th>${name}</th><th>Sp</th><th>Pkt</th><th>Tore</th><th>Diff</th><th>g</th><th>u</th><th>v</th></tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

function load(html: string) {
  const $ = cheerio.load(`<div id="kicktipp-content">${html}</div>`);
  return parseStandings($, $('#kicktipp-content'));
}

describe('parseStandings', () => {
  it('parses a single Bundesliga league table', () => {
    const groups = load(
      standingsTable('1. Bundesliga', [
        ['1.', 'FC Bayern München', '5', '15', '14:3', '11', '5', '0', '0'],
        ['2.', 'Borussia Dortmund', '5', '10', '9:5', '4', '3', '1', '1'],
      ]),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('1. Bundesliga');
    expect(groups[0].teams[0]).toEqual({
      position: '1.',
      team: 'FC Bayern München',
      played: '5',
      points: '15',
      goalsFor: '14',
      goalsAgainst: '3',
      goalDifference: '11',
      wins: '5',
      draws: '0',
      losses: '0',
    });
    expect(groups[0].teams[1].team).toBe('Borussia Dortmund');
    expect(groups[0].teams[1].goalsFor).toBe('9');
    expect(groups[0].teams[1].goalsAgainst).toBe('5');
  });

  it('parses multiple group tables for a tournament', () => {
    const groups = load(
      standingsTable('Gruppe A', [
        ['1.', 'Mexiko', '0', '0', '0:0', '0', '0', '0', '0'],
        ['1.', 'Südafrika', '0', '0', '0:0', '0', '0', '0', '0'],
      ]) +
        standingsTable('Gruppe B', [
          ['1.', 'Schweiz', '0', '0', '0:0', '0', '0', '0', '0'],
          ['1.', 'Katar', '0', '0', '0:0', '0', '0', '0', '0'],
        ]),
    );

    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.name)).toEqual(['Gruppe A', 'Gruppe B']);
    expect(groups[0].teams).toHaveLength(2);
    expect(groups[1].teams[0].team).toBe('Schweiz');
  });

  it('returns an empty array when no standings are present', () => {
    expect(load('<p>Seite wurde nicht gefunden</p>')).toEqual([]);
  });
});
