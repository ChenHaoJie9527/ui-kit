# AI Review Contract

This file tells the independent Reviewer what matters in seam-ui. Keep it
short. When the same false positive appears repeatedly, improve this file, a
pattern document, or a deterministic check instead of adding more prompt text.

## Report as a real issue

- Behavior that contradicts the originating spec or issue.
- A public API, export, composition, or controlled/uncontrolled state change
  that is incompatible or surprising.
- Missing keyboard access, focus management, ARIA state, disabled behavior, or
  screen-reader semantics.
- A violation of `DESIGN.md`, including motion choice, reduced motion, tokens,
  layering, touch behavior, or light/dark theming.
- A correctness problem in tests that would let a broken state pass.
- Missing exports, documentation, or Changesets required by repository policy.
- A security or release problem in workflows, scripts, or dependencies.

## Do not report

- Formatting, lint output, title style, or code layout that automated tools own.
- Personal taste that does not violate `DESIGN.md` or the originating spec.
- Generic cleanup, renaming, abstraction, or added tests unrelated to the change.
- Generated files, lockfile churn, or code that is already ignored by the diff.
- A pre-existing problem unless the change makes its impact materially worse.

## Evidence standard

- Name the file and line when possible.
- Quote or precisely describe the code that proves the issue.
- Explain the user-visible or contract impact.
- State whether this PR introduced the issue.
- Include a confidence level. If the evidence is incomplete, use
  `needs_human` rather than guessing.
- Return at most three low-severity nits. A clean result is valid and preferred
  over filling the review with weak findings.

## Convergence

- Keep finding ids stable across automatic revision rounds.
- Read the previous finding ledger before reviewing the new commit.
- Do not re-release a rejected finding unless new code or contract evidence
  materially changes the conclusion. When it does, reuse the id and explain the
  new evidence.
- Do not restate a resolved finding. If a confirmed defect persists after a
  repair, reuse its id and state specifically what remains.
- A blocking finding with low confidence must be marked `needs_human`; do not
  spend an automatic repair round on it.
