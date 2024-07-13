import { Octokit } from '@octokit/core';
import numeral from 'numeral';
import 'dotenv/config';
const kFormat = process.env.K_FORMAT.toString() === 'true';
const gistId = process.env.GIST_ID;

export async function updateGistStats(stats, githubToken) {
    const octokit = new Octokit({ auth: githubToken });
    const humanize = (n) => (n >= 1000 ? numeral(n).format(kFormat ? '0.0a' : '0,0') : n);

    const gistContent =
        [
            ['⭐', `Total Stars`, humanize(stats.totalStars)],
            ['➕', stats.countAllCommits ? 'Total Commits' : 'Past Year Commits', humanize(stats.totalCommits)],
            ['🔀', `Total PRs`, humanize(stats.totalPRs)],
            ['🚩', `Total Issues`, humanize(stats.totalIssues)],
            ['📦', `Contributed to`, humanize(stats.contributedTo)],
            ['💾', `Past Year Space Disk Used`, stats.totalDiskUsage + 'kB'],
        ]
            .map((content) => {
                let line = `${content[1]}:${content[2]}`;
                line = line.replace(':', ':' + ' '.repeat(45 - line.length));
                line = `${content[0]}    ${line}`;
                return line;
            })
            .join('\n') + '\n';

    const gist = await octokit.request('GET /gists/:gist_id', {
        gist_id: gistId,
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
            gist_id: gistId,
            headers: { authorization: `token ${githubToken}` },
        })
        .then(() => {
            console.info(`Updated Gist ${gistId} with the following content:\n${gistContent}`);
        });
}

export async function updateGistRecentCoding(editedFiles, githubToken) {
    const octokit = new Octokit({ auth: githubToken });
    const humanize = (n) => (n >= 1000 ? numeral(n).format(kFormat ? '0.0a' : '0,0') : n);

    for (let extension in editedFiles) {
        if (editedFiles.hasOwnProperty(extension)) {
            const file = editedFiles[extension];
            const additions = '+' + file.additions.toString().padStart(4);
            const deletions = '-' + file.deletions.toString().padStart(4);
            const percentage = file.percentage.toFixed(1).padStart(5);

            // Calculate progress bar (███████░░░░░░░░░░░░░░░░░)
            const progressBarLength = 20;
            const progress = Math.round((file.percentage * progressBarLength) / 100);
            const progressBar = '█'.repeat(progress) + '░'.repeat(progressBarLength - progress);

            // Print formatted output
            console.log(`${extension.padEnd(12)} ${additions}/${deletions} ${progressBar}  ${percentage}%`);
        }
    }
}
