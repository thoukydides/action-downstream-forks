// GitHub action
// Copyright © 2026 Alexander Thoukydides

import * as core from '@actions/core';
import { assertIsDefined, isValidDate, plural } from './utils.js';
import { GitHub } from '@actions/github/lib/utils.js';

// Details of a fork that is ahead of the base repository
export interface ForkBranchAhead {
    branch:     string;
    url:        string;
    ahead_by:   number;
    behind_by:  number;
    updated_at: Date;
}
export interface ForkAhead {
    fork:       string;
    url:        string;
    updated_at: Date;
    branches:   ForkBranchAhead[];
}

// Branch names to exclude
const EXCLUDED_BRANCHES: RegExp[] = [
    /^dependabot\//i
];

// Retrieve the list of forks and branches that are ahead of the base repository
// (forks and branches are both sorted by most recently updated first)
export async function getForksAhead(github: InstanceType<typeof GitHub>, repository: string, subForks: boolean): Promise<ForkAhead[]> {
    // Parse the repository specifier
    const [owner, repo] = repository.split('/', 2);
    if (!owner || !repo) throw new Error(`Invalid repository specifier: ${repository}`);
    const baseRepo = { owner, repo };

    // Get default branch of the base repo
    const baseRepoMetadata = (await github.rest.repos.get(baseRepo)).data;
    const baseBranch = baseRepoMetadata.default_branch;

    // Find all forks of the base repo
    const forks = await github.paginate(github.rest.repos.listForks, { owner, repo, per_page: 100 });
    core.info(`Base: ${baseRepo.owner}/${baseRepo.repo}:${baseBranch} has ${plural(forks.length, 'fork')}`);

    // Check each fork for commits ahead of the base repo
    const forksAhead: ForkAhead[] = [];
    const forksProcessed = new Set<string>();
    while (0 < forks.length) { // (ensure additions are also processed)
        const fork = forks.shift();
        assertIsDefined(fork);

        // Paranoid check for already processed forks
        if (forksProcessed.has(fork.full_name)) {
            core.warning(`Skipping already processed fork: ${fork.full_name}`);
            continue;
        }
        forksProcessed.add(fork.full_name);

        // List branches of fork
        const forkRepo = { owner: fork.owner.login, repo: fork.name };
        const forkBranches = await github.paginate(github.rest.repos.listBranches, { ...forkRepo, per_page: 100 });
        core.info(`Fork: ${fork.full_name} has ${plural(forkBranches.length, 'branch')} branches`);

        // Compare each of the fork's branches against the base repo's default branch
        const branchesAhead: ForkBranchAhead[] = [];
        for (const forkBranch of forkBranches) {
            try {
                // Skip excluded branches
                if (EXCLUDED_BRANCHES.some((re) => re.test(forkBranch.name))) {
                    core.info(`Skipping excluded branch: ${fork.full_name}:${forkBranch.name}`);
                    continue;
                }

                const basehead = `${baseBranch}...${fork.owner.login}:${forkBranch.name}`;
                const compare = (await github.rest.repos.compareCommitsWithBasehead({ ...baseRepo, basehead })).data;
                core.info(`Fork ${fork.full_name}:${forkBranch.name} is ${compare.status}`
                    + ` (${plural(compare.ahead_by, 'commit')} ahead + ${plural(compare.behind_by, 'commit')} behind)`);

                // Check whether there are any new commits ahead of the base repo
                // (the last commit in the list is the most recent of the entire comparison)
                const lastCommitDateISO = compare.commits.at(-1)?.commit.committer?.date;
                const lastCommitDate    = lastCommitDateISO ? new Date(lastCommitDateISO) : null;
                if (isValidDate(lastCommitDate)) {
                    branchesAhead.push({
                        branch:     forkBranch.name,
                        url:        compare.html_url,
                        ahead_by:   compare.ahead_by,
                        behind_by:  compare.behind_by,
                        updated_at: lastCommitDate
                    });
                } else if (0 < compare.ahead_by) {
                    core.warning(`Could not determine last commit date for ${fork.full_name}:${forkBranch.name} `
                        + `despite being ${plural(compare.ahead_by, 'commit')} ahead`);
                }
            } catch (err) {
                const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
                core.warning(`Error comparing ${fork.full_name}:${forkBranch.name} to base repository: ${message}`);
            }
        }

        // If any branches are ahead, record the fork
        branchesAhead.sort(compareUpdatedAtDesc);
        const updated_at = branchesAhead[0]?.updated_at;
        if (updated_at) {
            forksAhead.push({
                fork:       fork.full_name,
                url:        fork.html_url,
                updated_at,
                branches:   branchesAhead
            });
        }

        // If the fork has its own forks then check them too
        if (subForks && fork.forks_count) {
            const subForks = await github.paginate(github.rest.repos.listForks, { ...forkRepo, per_page: 100 });
            core.info(`Fork: ${fork.full_name} has ${plural(subForks.length, 'fork')} of its own; checking them too`);
            forks.push(...subForks);
        }
    }
    core.info(`Found ${plural(forksAhead.length, 'fork')} with new commits ahead of the base repository`);

    // Action outputs
    forksAhead.sort(compareUpdatedAtDesc);
    return forksAhead;
}

// Compare the updated_at dates of two objects (for descending sort)
function compareUpdatedAtDesc(a: { updated_at: Date }, b: { updated_at: Date }): number {
    return b.updated_at.getTime() - a.updated_at.getTime();
}