import ky from 'ky';
import axios from 'axios';
import { Octokit } from '@octokit/core';

export const userInfoFetcher = (token) => {
    return axios({
        url: 'https://api.github.com/graphql',
        method: 'post',
        headers: {
            Authorization: `bearer ${token}`,
        },
        data: {
            query: `
        query userInfo {
          viewer {
            name
            login
            contributionsCollection {
              totalCommitContributions
            }
            repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
              totalCount
              totalDiskUsage
            }
            pullRequests(first: 1) {
              totalCount
            }
            issues(first: 1) {
              totalCount
            }
            repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {direction: DESC, field: STARGAZERS}) {
              totalCount
              nodes {
                stargazers {
                  totalCount
                }
              }
            }
          }
        }`,
        },
    });
};

// Experimental API
export const totalCommitsFetcher = async (login, token) => {
    return axios({
        method: 'get',
        url: `https://api.github.com/search/commits?q=author:${login}`,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.cloak-preview',
            Authorization: `bearer ${token}`,
        },
    }).then((res) => res.data.total_count);
};

export const recentCommitFilesInfos = async (token) => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    twoWeeksAgo.getDate();
    const date = twoWeeksAgo.toISOString();
    //const date = "20180818T032310Z";

    return axios({
        url: 'https://api.github.com/graphql',
        method: 'post',
        headers: {
            Authorization: `bearer ${token}`,
        },
        data: {
            query: `
      query {
        viewer {
          repositories(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
            edges {
              node {
                nameWithOwner
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(since : "${date}") {
                        edges {
                          node {
                            oid
                            resourcePath
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      `,
        },
    });
};
