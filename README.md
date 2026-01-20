# `action-downstream-forks`

This action identifies forks that have commits ahead of the base repository.

> [!CAUTION]
> This action is provided for my own use and published in case it is useful to others. If you rely on it, fork and maintain your own copy. No support or stability guarantees are offered.

## Prerequisites

Before using this workflow, ensure:
- The workflow has `contents: read` and `metadata: read` permissions (either via the default `GITHUB_TOKEN` or a fine-grained token).

## Inputs

Various inputs are defined in the action to configure its operation:

| Name | Description | Default
| --- | --- | ---
| `repository` | The base repository in the format `'owner/repo'` | `${{ github.repository }}`
| `sub_forks` | Whether to include forks of forks when checking for downstream commits | `true`
| `github_token` | The GitHub token used to create an authenticated client | `${{ github.token }}`

## Outputs

The action provides the following outputs:

| Name | Description
| --- | ---
| `updated_at` | The most recent update date (ISO format) among the downstream forks with commits ahead of the base repository (`""` if none)
| `json` | JSON array of downstream forks with commits ahead of the base repository (`[]` if none)
| `markdown` | Markdown table of downstream forks with commits ahead of the base repository

## Usage

Example workflow to add a summary of downstream forks to the workflow summary:

```yaml
name: Downstream Forks Report
permissions:
  contents: read
  metadata: read

on:
  workflow_dispatch:
  schedule:
    # Runs at 09:00 UTC daily
    # Stagger different repos to avoid hitting GitHub API rate limits
    - cron: '0 9 * * *'

jobs:
  opened-issue-comment:
    runs-on: ubuntu-latest

    steps:
      - name: Identify downstream forks
        id: forks
        uses: thoukydides/action-downstream-forks@v1
        with:
          sub_forks: true

      - name: Add the markdown output to the workflow summary
        env:
          SUMMARY: |
            ${{ steps.forks.outputs.markdown }}
        run: | # shell
          printf '%s' "$SUMMARY" >> "$GITHUB_STEP_SUMMARY"
```

## ISC License (ISC)

<details>
<summary>Copyright © 2026 Alexander Thoukydides</summary>

> Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
</details>