# frame/cron-worker

A Cloudflare Worker that triggers the [`Update /frame`](../../.github/workflows/update-frame.yml)
GitHub Actions workflow once an hour.

## Why this exists

`update-frame.yml` used to have its own `schedule:` trigger
(`cron: "7 * * * *"`), but GitHub Actions' native scheduler proved
unreliable for this repo — most hourly windows produced no run at all
(confirmed via `gh run list --workflow=update-frame.yml`, filtering on
`event == "schedule"`). Moving the cron off the top of the hour didn't fix
it, and neither did force-pushing a commit to resync the schedule
registration (a workaround suggested in
[github.com/orgs/community/discussions/185024](https://github.com/orgs/community/discussions/185024)).
The `schedule:` trigger was removed from the workflow after this Worker was
deployed, to avoid the two triggers occasionally racing to push the same
commit.

`workflow_dispatch` runs, by contrast, have a 100% success rate. This Worker
exists purely to be a reliable external clock that calls the GitHub API's
`workflow_dispatch` endpoint every hour, since GitHub's own scheduler won't
reliably call it itself.

## How it works

`worker.js` exports:
- `scheduled` — fires on the Worker's Cron Trigger, POSTs to
  `repos/tallzilla/tallzilla.github.io/actions/workflows/update-frame.yml/dispatches`
  using a GitHub token stored as a Worker secret.
- `fetch` — a no-op handler that just returns a static message, so that
  visiting the Worker's URL in a browser doesn't throw (Workers without a
  `fetch` handler return a 500 for any HTTP request, including the browser's
  automatic `/favicon.ico` fetch).

## Deployment

This is deployed by hand through the Cloudflare dashboard, not via CI/CD or
`wrangler` — there's no build step, and the file in this repo is the source
of truth to copy from, not something Cloudflare pulls automatically.

1. Cloudflare dashboard → Workers & Pages → the `dawn-rain-eed6` Worker →
   **Edit code**, paste in the contents of `worker.js`, deploy.
2. **Settings → Variables and Secrets** → secret named `GITHUB_TOKEN` — a
   GitHub fine-grained personal access token scoped to only this repo, with
   **Actions: read and write** permission and nothing else. Expires
   annually; needs manual rotation before then.
3. **Settings → Trigger events → Cron Triggers** → `7 * * * *` (matches the
   workflow's own schedule expression, though the exact minute doesn't
   matter functionally since Cloudflare's scheduler isn't subject to the
   top-of-hour congestion that affects GitHub's).

## Verifying it's working

Check two things after a scheduled run should have fired:
- The Worker's **Logs** (Observability tab) for a `scheduled` event.
- [`update-frame.yml`'s run list](https://github.com/tallzilla/tallzilla.github.io/actions/workflows/update-frame.yml)
  for a new `workflow_dispatch` run around the same time.
