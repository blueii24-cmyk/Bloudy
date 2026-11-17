# blueii24-cmyk/Bloud — archived before replacement (2026-11-17)

This repo held the **older** Bloud app (Google Drive + Supabase Auth, `master`).
It has been superseded by `blueii24-cmyk/Bloudy`, which is what the Vercel
project now deploys.

The full history of the old repo is preserved here as `bloud-old-repo.bundle`
(a git bundle — all 7 branches, all commits, tags). Restore it with:

```bash
git clone docs/old-repo-backup/bloud-old-repo.bundle Bloud
cd Bloud
gh repo create blueii24-cmyk/Bloud --public
git push --all origin && git push --tags origin
```

## Branches (7)

`master`, `arena/2978ae4b-bloud`, `arena/7628f1d7-bloud`, `arena/091b7d6d-bloud`,
`arena/e1325605-bloud`, `arena/0e536bfa-bloud`, `arena/9dcc4275-bloud`

## Pull requests (6)

- #1 Integrate Supabase + deploy to Vercel — merged 2026-11-12 — `arena/2978ae4b-bloud`
- #2 Add Spotify-inspired login page (Supabase Auth + guest mode) — merged 2026-11-12 — `arena/7628f1d7-bloud`
- #3 Use minimal login preview HTML design — merged 2026-11-12 — `arena/091b7d6d-bloud`
- #4 Add Google sign-in and Google Drive music streaming — merged 2026-11-12 — `arena/e1325605-bloud`
- #5 Restore local music folder selection — merged 2026-11-12 — `arena/0e536bfa-bloud`
- #6 Harden account-scoped cloud sharing — open (never merged) — `arena/9dcc4275-bloud`

No issues existed.

## Why it was not deleted outright

The arena GitHub integration is not a repo admin, so `DELETE /repos/...` and
`PATCH archived=true` both return **403 Resource not accessible by integration**.
Deleting or archiving the old repo therefore needs a click from the account
owner: GitHub → the repo → Settings → scroll to *Danger Zone* → **Archive** or
**Delete**. Nothing depends on it any more — the live site runs from `Bloudy`.
