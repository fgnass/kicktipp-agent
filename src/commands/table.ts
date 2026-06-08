import { Command } from 'commander';
import { launchBrowser } from '../browser.js';
import { fetchTable } from '../core.js';
import { ensureCommunity } from '../shared.js';
import { status, statusClear } from '../helpers/spinner.js';
import type { TableGroup } from '../helpers/parse-standings.js';

function printGroup(group: TableGroup, showName: boolean): void {
  if (showName && group.name) {
    console.log(group.name);
  }
  const tw = Math.max('Team'.length, ...group.teams.map((t) => t.team.length));
  console.log(
    `  ${'Pos'.padEnd(5)} ${'Team'.padEnd(tw)} ${'P'.padStart(3)} ${'Pts'.padStart(4)} ${'GF'.padStart(3)} ${'GA'.padStart(3)} ${'GD'.padStart(4)} ${'W'.padStart(3)} ${'D'.padStart(3)} ${'L'.padStart(3)}`,
  );
  console.log(`  ${'-'.repeat(tw + 40)}`);
  for (const t of group.teams) {
    console.log(
      `  ${t.position.padEnd(5)} ${t.team.padEnd(tw)} ${t.played.padStart(3)} ${t.points.padStart(4)} ${t.goalsFor.padStart(3)} ${t.goalsAgainst.padStart(3)} ${t.goalDifference.padStart(4)} ${t.wins.padStart(3)} ${t.draws.padStart(3)} ${t.losses.padStart(3)}`,
    );
  }
}

export function registerTableCommand(program: Command): void {
  program
    .command('table')
    .description('Display the league table (or all group tables for tournaments)')
    .option('--home', 'Show home table only')
    .option('--away', 'Show away table only')
    .action(async (opts) => {
      const { browser, page } = await launchBrowser();
      try {
        const community = await ensureCommunity(page);

        const option = opts.home ? 'home' : opts.away ? 'away' : undefined;
        status('Loading table...');
        const { label, groups } = await fetchTable(page, community, option);
        statusClear();

        console.log(label);
        console.log();

        if (!groups.length) {
          console.log('No table found.');
          return;
        }

        const showNames = groups.length > 1;
        groups.forEach((group, i) => {
          printGroup(group, showNames);
          if (i < groups.length - 1) console.log();
        });
      } finally {
        await browser.close();
      }
    });
}
