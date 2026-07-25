---
name: Imported dependency verification
description: A caution for verifying imported repositories when dependencies are absent.
---

When an imported repository has no installed dependencies, installing packages for local verification may rewrite the root manifest, lockfile, and generated framework files even if the feature did not require dependency changes.

**Why:** Package installation resolved the app successfully but also produced unrelated tracked changes that would have polluted a focused pull request.

**How to apply:** Before committing, compare package/config/generated files against the branch base and restore any installation-only changes. Keep the verification result, not the installer’s metadata churn.