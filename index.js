#!/usr/bin/env node
'use strict';
import { userInfoFetcher, totalCommitsFetcher, recentCommitFilesInfos } from './fetch.js';
import { updateGist } from './gh.js';
const githubToken = process.env.GH_TOKEN;
const countAllCommits = process.env.ALL_COMMITS.toString() === 'true';

async function main() {
    if (!githubToken) {
        throw new Error('GH_TOKEN is not defined');
    }
    let stats;
    try {
        stats = await getStats();
        console.info('Successfully fetched statistics from GitHub');
        console.info(JSON.stringify(stats, null, 2));
    } catch (e) {
        throw new Error(`cannot retrieve statistics: ${e.message}`);
    }
    try {
        await updateGist(stats, githubToken);
        null;
    } catch (e) {
        throw new Error(`cannot update gist: ${e.message}`);
    }
}

async function getStats() {
    const stats = {
        name: '',
        totalPRs: 0,
        totalCommits: 0,
        totalIssues: 0,
        totalStars: 0,
        contributedTo: 0,
        totalDiskUsage: 0,
        countAllCommits: false,
    };

    if (countAllCommits) {
        stats.countAllCommits = true;
    }

    const user = await userInfoFetcher(githubToken).then((res) => res.data.data.viewer);

    stats.name = user.name || user.login;
    stats.totalPRs = user.pullRequests.totalCount;
    stats.totalIssues = user.issues.totalCount;
    stats.contributedTo = user.repositoriesContributedTo.totalCount;
    stats.totalDiskUsage = user.repositoriesContributedTo.totalDiskUsage;
    stats.totalStars = user.repositories.nodes.reduce((prev, curr) => {
        return prev + curr.stargazers.totalCount;
    }, 0);

    stats.totalCommits = user.contributionsCollection.totalCommitContributions;
    if (countAllCommits) {
        //stats.totalCommits = await totalCommitsFetcher(user.login, githubToken);
        //not working anymore
    }

    return stats;
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
