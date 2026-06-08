import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

export interface TableTeam {
  position: string;
  team: string;
  played: string;
  points: string;
  goalsFor: string;
  goalsAgainst: string;
  goalDifference: string;
  wins: string;
  draws: string;
  losses: string;
}

export interface TableGroup {
  /** Group/competition name from the table header (e.g. "Gruppe A"); empty for a single league table. */
  name: string;
  teams: TableTeam[];
}

type StatKey =
  | 'played'
  | 'points'
  | 'goals'
  | 'goalsFor'
  | 'goalsAgainst'
  | 'goalDifference'
  | 'wins'
  | 'draws'
  | 'losses'
  | '';

/** Map a kicktipp standings header abbreviation to a TableTeam field. */
function mapHeaderToKey(header: string): StatKey {
  const k = header.toLowerCase().trim();
  if (k === 'sp' || k.startsWith('spiel')) return 'played';
  if (k === 'pkt' || k.startsWith('punkt')) return 'points';
  if (k === 'tore') return 'goals'; // combined "x:y"
  if (k === 'gf' || k.includes('erzielt')) return 'goalsFor';
  if (k === 'ga' || k === 'gt' || k.includes('gegentor')) return 'goalsAgainst';
  if (k === 'diff' || k === 'td' || k.includes('differ')) return 'goalDifference';
  if (k === 'g' || k === 's' || k.startsWith('sieg') || k.startsWith('gewonn')) return 'wins';
  if (k === 'u' || k === 'r' || k.startsWith('unent') || k.startsWith('remis')) return 'draws';
  if (k === 'v' || k === 'n' || k.startsWith('verlor') || k.startsWith('niederl')) return 'losses';
  return '';
}

function emptyTeam(): TableTeam {
  return {
    position: '',
    team: '',
    played: '',
    points: '',
    goalsFor: '',
    goalsAgainst: '',
    goalDifference: '',
    wins: '',
    draws: '',
    losses: '',
  };
}

function parseTable($: cheerio.CheerioAPI, tableEl: AnyNode): TableGroup | null {
  const $table = $(tableEl);

  // Header cells: first is the group/competition name, the rest are stat columns.
  const headers: string[] = [];
  $table.find('thead th, thead td').each((_, th) => {
    headers.push($(th).text().trim());
  });
  const name = headers.length ? headers[0] : '';
  const statKeys = headers.slice(1).map(mapHeaderToKey);

  const teams: TableTeam[] = [];
  $table.find('tbody tr').each((_, tr) => {
    const cols = $(tr).children('td');
    if (cols.length < 4) return; // not a standings row
    const team = $(cols[1]).text().trim();
    if (!team) return;

    const t = emptyTeam();
    t.position = $(cols[0]).text().trim();
    t.team = team;

    // Body stat cells start at index 2 and align with headers[1..].
    for (let i = 0; i < statKeys.length; i++) {
      const cell = cols[2 + i];
      if (cell === undefined) break;
      const key = statKeys[i];
      if (!key) continue;
      const val = $(cell).text().trim();
      if (key === 'goals') {
        const [gf, ga] = val.split(':');
        t.goalsFor = (gf ?? '').trim();
        t.goalsAgainst = (ga ?? '').trim();
      } else {
        t[key] = val;
      }
    }
    teams.push(t);
  });

  return teams.length ? { name, teams } : null;
}

/**
 * Parse all standings tables inside the given content element.
 * Returns one group per table — a single entry for a league (Bundesliga),
 * multiple entries for a group-stage tournament (World Cup, Euros).
 */
export function parseStandings($: cheerio.CheerioAPI, content: cheerio.Cheerio<AnyNode>): TableGroup[] {
  let tables = content.find('table.sporttabelle');
  if (!tables.length) tables = content.find('table'); // fallback for layout changes

  const groups: TableGroup[] = [];
  tables.each((_, el) => {
    const group = parseTable($, el);
    if (group) groups.push(group);
  });
  return groups;
}
