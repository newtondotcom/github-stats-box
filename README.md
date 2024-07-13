<p align="center">
  <a href="https://gist.github.com/newtondotcom/c304c869aa667a185d7e433f11e41dc2/">
    <img src="https://raw.githubusercontent.com/newtondotcom/github-stats-box/images/stats.png">
  </a>
  <a href="https://gist.github.com/newtondotcom/e6aefaa99f5bb8a7de77a9e118945b2f">
      <img src="https://raw.github.com/newtondotcom/github-stats-box/images/code.png">
  </a>
  <h3 align="center">github-stats-box</h3>
  <p align="center">⚡️📌 Automatically update your pinned gists to display your latest GitHub stats</p>

</p>

---

## Prep work

1. Create a new public GitHub Gist (https://gist.github.com/new)
2. Create a token with the `gist` and `repo` scopes and copy it (https://github.com/settings/tokens/new)

## Project setup

1. Fork this repository
2. From your new fork, go to **Settings > Secrets**
3. Add the following secret using the **New secret** button:

    - **GH_TOKEN:** The GitHub token generated above.

4. Go to the **Actions** tab of your fork and click the "enable" button
5. Edit the environment variables at the end of the file `.github/workflows/run.yml`

    - **GIST_ID_STATS:** The ID portion from your gist url: `https://gist.github.com/bokub/`**`1cc900d92b9acc15786d7553b46a2cdf`**.
    - **GIST_ID_CODING:** The ID portion from your gist url: `https://gist.github.com/bokub/`**`1cc900d92b9acc15786d7553b46a2cdf`**.
    - **ALL_COMMITS:** Boolean value, If `true` it will count all commits instead of last year commits
    - **K_FORMAT:** Boolean value, If `true`, large numbers values will be formatted with a "k", for example `1.5k`

6. (Optional) Edit the file `utils.js` :

-   to exclude the extensions you want by editing `const extensionToExclude` (line 1)
-   display the languages as you want by editing `const extensionToName` (line 2)
-   Edit the environment variable named `STATS_VERSION` at the end of the file `.github/workflows/run.yml` to choose between the two versions : one is dispaying disk usage like [here](https://github.com/newtondotcom) and one is displaying pull requests number like [here](https://github.com/bokub)

That's it! You gist will be updated immediately, and every 12 hours after that

> Note : the total disk space only takes in consideration the 100 first repo
