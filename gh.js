import { Octokit } from '@octokit/core';
import numeral from 'numeral';
import 'dotenv/config';
import { extensionToName, capitalizeFirstLetter, extensionToExclude } from './utils.js';
const kFormat = process.env.K_FORMAT.toString() === 'true';
const gistIdStats = process.env.GIST_ID_STATS;
const gistIdCoding = process.env.GIST_ID_CODING;
const STATS_VERSION = process.env.STATS_VERSION || '1';

export async function updateGistStats(stats, githubToken) {
    const octokit = new Octokit({ auth: githubToken });
    const humanize = (n) => (n >= 1000 ? numeral(n).format(kFormat ? '0.0a' : '0,0') : n);

    let gistContent = [
        ['⭐', `Total Stars`, humanize(stats.totalStars)],
        ['➕', stats.countAllCommits ? 'Total Commits' : 'Past Year Commits', humanize(stats.totalCommits)],
        ['🚩', `Total Issues`, humanize(stats.totalIssues)],
        ['📦', `Contributed to`, humanize(stats.contributedTo)],
    ];
    if (STATS_VERSION === '2') {
        gistContent.push(['🔀', `Total PRs`, humanize(stats.totalPRs)]);
    } else {
        gistContent.push([
            '💾',
            stats.countAllCommits ? `Total Disk Usage` : `Past year Disk Usage`,
            stats.totalDiskUsage + ' kb',
        ]);
    }

    gistContent =
        gistContent
            .map((content) => {
                let line = `${content[1]}:${content[2]}`;
                line = line.replace(':', ':' + ' '.repeat(45 - line.length));
                line = `${content[0]}    ${line}`;
                return line;
            })
            .join('\n') + '\n';

    const gist = await octokit.request('GET /gists/:gist_id', {
        gist_id: gistIdStats,
        headers: { authorization: `token ${githubToken}` },
    });
    const filename = Object.keys(gist.data.files)[0];

    if (gist.data.files[filename].content === gistContent) {
        console.info('Nothing to update');
        return;
    }

    return octokit
        .request('PATCH /gists/:gist_id', {
            files: {
                [filename]: {
                    filename: `${stats.name}'s GitHub Stats`,
                    content: gistContent,
                },
            },
            gist_id: gistIdStats,
            headers: { authorization: `token ${githubToken}` },
        })
        .then(() => {
            console.info(`Updated Gist ${gistIdStats} with the following content:\n${gistContent}`);
        });
}

export async function updateGistRecentCoding(editedFiles, githubToken) {
    const octokit = new Octokit({ auth: githubToken });
    const humanize = (n) => (n >= 1000 ? numeral(n).format('0a') : n);
    let gistContent = '';
    let lines = [];

    const lengthExtension = 13;
    const progressBarLength = 19;

    for (let extension in editedFiles) {
        if (editedFiles.hasOwnProperty(extension)) {
            const file = editedFiles[extension];
            let fullExtension = extensionToName[extension] || capitalizeFirstLetter(extension);

            // Truncate extension if it's too long
            if (fullExtension.length > lengthExtension) {
                fullExtension = fullExtension.slice(0, lengthExtension - 1) + '…';
            }

            // Ensure additions and deletions take up 7 characters
            const additions = ('+' + humanize(file.additions)).toString().padStart(3, ' ').padEnd(4, ' ');
            const deletions = ('-' + humanize(file.deletions)).toString().padStart(3, ' ').padEnd(4, ' ');
            const percentage = file.percentage.toFixed(1).padStart(5);

            // Calculate progress bar
            const progress = Math.round((file.percentage * progressBarLength) / 100);
            const progressBar = '█'.repeat(progress) + '▌' + '░'.repeat(progressBarLength - progress - 1);
            const progressBarWithMarker = progressBar.slice(0, progressBarLength - 1);

            // Create a formatted line
            const line = `${fullExtension.padEnd(
                17
            )} ${additions}/${deletions} ${progressBarWithMarker} ${percentage}%`;
            lines.push({ percentage: file.percentage, line });
        }
    }

    // Sort lines by percentage in descending order
    lines.sort((a, b) => b.percentage - a.percentage);

    // Concatenate sorted lines into gistContent
    gistContent = lines.map((entry) => entry.line).join('\n') + '\n';

    const gist = await octokit.request('GET /gists/:gist_id', {
        gist_id: gistIdCoding,
        headers: { authorization: `token ${githubToken}` },
    });
    const filename = Object.keys(gist.data.files)[0];

    if (gist.data.files[filename].content === gistContent) {
        console.info('Nothing to update');
        return;
    }

    return octokit
        .request('PATCH /gists/:gist_id', {
            files: {
                [filename]: {
                    filename: `Recent Coding Activity`,
                    content: gistContent,
                },
            },
            gist_id: gistIdCoding,
            headers: { authorization: `token ${githubToken}` },
        })
        .then(() => {
            console.info(`Updated Gist ${gistIdCoding} with the following content:\n${gistContent}`);
        });
}
