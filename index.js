#!/usr/bin/env node
'use strict';
import { userInfoFetcher, totalCommitsFetcher, recentCommitFilesInfos, getCommitFiles } from './fetch.js';
import { updateGistStats, updateGistRecentCoding } from './gh.js';
import { extensionToExclude } from './utils.js';
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
        await updateGistStats(stats, githubToken);
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

async function getRecentCommits() {
    const response = await recentCommitFilesInfos(githubToken);
    const viewer = response.data.data.viewer;
    const repositories = viewer.repositories.edges;
    let latestCommits = [];
    repositories.forEach((repo) => {
        if (repo.node.defaultBranchRef == null) {
            return;
        }
        const commitInfo = repo.node.defaultBranchRef.target.history.edges;
        if (commitInfo.length === 0) {
            return;
        }
        const repoRecentCommits = commitInfo.map((commit) => {
            const path = commit.node.resourcePath;
            return {
                owner: path.split('/')[1],
                repo: path.split('/')[2],
                ref: path.split('/')[4],
            };
        });
        latestCommits.push(...repoRecentCommits);
    });
    return latestCommits;
}

async function getCommitsEditedFilesExtensions(latestCommits) {
    const commits = latestCommits;
    let editedFiles = {};
    const promises = latestCommits.map(async (commit) => {
        const files = await getCommitFiles(commit.owner, commit.repo, commit.ref, githubToken);

        files.forEach((file) => {
            let extension = file.filename.split('.').pop();

            // Some files have extensions like 'file.tar.gz'
            if (extension.split('/').length > 1) {
                extension = extension.split('/').pop();
            }

            // Exclude some extensions
            if (extensionToExclude[extension.toLowerCase()]) {
                return;
            }

            const additions = file.additions;
            const deletions = file.deletions;
            const changes = additions + deletions;
            const editedFile = {
                extension,
                changes,
                additions,
                deletions,
            };

            if (editedFiles[extension]) {
                editedFiles[extension].additions += additions;
                editedFiles[extension].deletions += deletions;
                editedFiles[extension].changes += changes;
            } else {
                editedFiles[extension] = editedFile;
            }
        });
    });

    await Promise.all(promises);
    const totalChange = Object.values(editedFiles).reduce((acc, file) => acc + file.changes, 0);
    for (let extension in editedFiles) {
        if (editedFiles.hasOwnProperty(extension)) {
            editedFiles[extension].percentage = (editedFiles[extension].changes / totalChange) * 100;
        }
    }
    return editedFiles;
}

async function main2() {
    const commits = await getRecentCommits();
    /*
    const commits = [
        {
            owner: 'newtondotcom',
            repo: 'github-stats-box',
            ref: 'b2b30f92b6d12a2f15d911c0caa2b6bff3a04bb8',
        },
    ];
    */
    const editedFiles = await getCommitsEditedFilesExtensions(commits);
    await updateGistRecentCoding(editedFiles, githubToken);
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});

main2().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
