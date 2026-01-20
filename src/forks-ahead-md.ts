// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { relativeDateString } from './date-format.js';
import { ForkAhead } from './forks-ahead.js';
import { plural } from './utils.js';

// Convert the list of forks ahead into a markdown table
export function forksAheadToMarkdown(forksAhead: ForkAhead[]): string {
    if (forksAhead.length === 0) {
        return 'No forks are ahead of the base repository';
    }

    // Output a markdown block for each fork
    const lines: string[] = [];
    for (const fork of forksAhead) {
        // Header for this fork
        lines.push('---', '', `### [${fork.fork}](${fork.url})`);

        // List of branches
        for (const branch of fork.branches) {
            lines.push(
                `- **[${branch.branch}](${branch.url})**`,
                `  - ${plural(branch.ahead_by, 'commit')} ahead, ${plural(branch.behind_by, 'commit')} behind`,
                `  - Updated ${relativeDateString(branch.updated_at)}`
            );
        }
    }
    lines.push('---');
    return lines.join('\n');
}