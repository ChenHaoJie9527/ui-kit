# Agent Instructions

## UI design contract

Read `DESIGN.md` in full before changing any of the following:

- adding an exported component, variant, or interaction pattern;
- changing a public component prop, state model, keyboard behavior, or ARIA;
- changing motion, easing, duration, layering, hover, touch, or focus behavior;
- changing visual tokens or component CSS that affects more than one component;
- adding a component demo or claiming a visual change is complete.

For a narrow bug fix with no visual, API, or interaction change, apply only the
relevant gates in `DESIGN.md`.

`DESIGN.md` owns design and motion rules. `CONTRIBUTING.md` owns commits,
Changesets, and publishing. This file owns the execution order.

## Required workflow

### 1. Establish the baseline

Inspect the closest existing component, related hooks, tests, styles, and docs.
Identify reusable API, tokens, state behavior, and accessibility behavior.

Complete when you can name what will be reused and what genuinely needs to be
new.

### 2. Define behavior before appearance

Write down the component's purpose, state model, public API, composition model,
keyboard behavior, focus behavior, and failure states. For a modification,
identify compatibility and migration impact.

Complete when every interactive state and its expected accessibility behavior
has a decision. Do not start with animation values.

### 3. Pass the motion gate

For every proposed animation, record its frequency, purpose, and user benefit
using the gate in `DESIGN.md`. Decide CSS, Motion, or no animation before
choosing values.

Complete when every animation has a named purpose and a selected implementation
driver, and every candidate that should stay still has been removed.

### 4. Prototype unfamiliar visual decisions

When introducing a new interaction language, more than one credible visual
direction, or a change spanning several components, create three genuinely
different interactive directions in an isolated prototype. Show them to the
user and stop for a choice before changing production code.

Minor fixes and components that follow an established recipe do not need a
prototype.

Complete when an established pattern is explicitly reused, or the user has
selected a prototype direction.

### 5. Implement through the system

Reuse semantic tokens and existing primitives. Keep simple state transitions in
CSS. Use Motion for exit presence, dynamic queues, shared layout, springs, and
gestures as defined in `DESIGN.md`.

New public components must include the implementation, exports, styles, tests,
docs demo/API information, and a Changeset. Modify existing components without
unnecessary API churn or unrelated visual refactors.

Complete when the implementation and all user-facing integration points exist,
and no new parallel token or interaction system was introduced.

### 6. Verify behavior and craft

Run the repository checks that cover the change. Exercise keyboard, focus,
screen-reader semantics, reduced motion, touch, light/dark themes, long content,
rapid repeated actions, and nested overlays where applicable. Review animations
in a real browser at slow speed as well as normal speed.

Complete when automated checks pass, every affected interaction has been
observed, and every applicable item in the `DESIGN.md` review checklist passes.

### 7. Prepare the change for release

Document new or changed behavior and add a Changeset when package behavior is
user-visible. Follow `CONTRIBUTING.md` for versioning and commit format. Verify
the built package when changing dependencies, exports, or build configuration.

Complete when code, tests, docs, compatibility notes, release metadata, and
package verification match the delivered behavior.

## Delivery rules

- Preserve native semantics, keyboard access, focus management, and screen
  reader behavior as part of the feature, not as follow-up work.
- Do not weaken `DESIGN.md` to make an implementation pass. Change the design
  contract only when the user requests a system-level design change or verified
  product evidence requires one; surface the conflict before proceeding.
- Treat Motion as the shared animation layer the project has chosen. Do not add
  another animation runtime without explicit direction.
- External design skills and component libraries are references. Adapt their
  principles into this repository; do not copy their APIs, opinions, or source
  wholesale.
- If an upstream rule conflicts with `DESIGN.md`, this repository wins.
- Keep unrelated worktree changes intact and report what was actually verified.
