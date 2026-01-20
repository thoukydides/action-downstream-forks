// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { relativeDateString } from './date-format.js';
import { ForkAhead } from './forks-ahead.js';
import { plural } from './utils.js';

// Convert the list of forks ahead into a markdown table
export function forksAheadToMarkdown(forksAhead: ForkAhead[]): string {
    if (forksAhead.length === 0) {
        return 'No forks are ahead of the base repository.';
    }

    // Table header
    const lines: string[] = [];
    lines.push('| Fork | Branches | Last Commit |');
    lines.push('| ---- | -------- | ----------- |');

    // Table rows
    for (const fork of forksAhead) {
        const forkLink = `[${fork.fork}](${fork.url})`;
        const branches = fork.branches.map(branch =>
            `[${branch.branch}](${branch.url}) (${plural(branch.ahead_by, 'commit')} ahead, ${plural(branch.behind_by, 'commit')} behind)`);
        const updated = `Updated ${relativeDateString(fork.updated_at)}`;
        lines.push(`| ${forkLink} | ${branches.join('<br>')} | ${updated} |`);
    }
    return lines.join('\n');
}