// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { getOctokit } from '@actions/github';
import * as core from '@actions/core';
import { getForksAhead } from './forks-ahead.js';
import { forksAheadToMarkdown } from './forks-ahead-md.js';

// Script entry point
async function run() {
    // Action inputs
    const repository    = core.getInput         ('repository',   { required: true });
    const subForks      = core.getBooleanInput  ('sub_forks',    { required: true });
    const token         = core.getInput         ('github_token', { required: true });

    // Create an authenticated GitHub client
    const github = getOctokit(token);

    // Retrieve the list of forks ahead of the base repository
    const forksAhead = await getForksAhead(github, repository, subForks);
    const lastUpdatedAt = forksAhead[0]?.updated_at;

    // Generate a markdown table of the results
    const forksAheadMd = forksAheadToMarkdown(forksAhead);

    // Action outputs
    core.setOutput('updated_at',    lastUpdatedAt?.toISOString() ?? '');
    core.setOutput('json',          forksAhead);
    core.setOutput('markdown',      forksAheadMd);
}

// Run the script and handle errors
try {
    await run();
} catch (err) {
    core.setFailed(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
    if (err instanceof Error && err.stack) core.debug(err.stack);
}