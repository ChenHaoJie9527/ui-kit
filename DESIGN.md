# seam UI Design and Motion System

This is the design reference for `seam-react`. It defines the visual
personality, motion decisions, implementation boundaries, and review criteria
used when components are added or changed.

The repository workflow lives in `AGENTS.md`. Release mechanics live in
`CONTRIBUTING.md`.

## Design thesis

> Fluid, immediate, physical. Consistent by default; expressive by exception.

The default experience should feel fast, composed, and physical without being
decorative. Simple controls favor clarity and immediate feedback. Overlays may
carry more character because they represent a deliberate context change.
Expressive motion belongs to a small set of explicitly selected surfaces, not
to every component.

The design system should optimize for:

- legibility before novelty;
- one clear spatial story per interaction;
- fast repeated use;
- coherent behavior across mouse, touch, keyboard, and assistive technology;
- visual character concentrated in a few memorable moments.

### Decision: Fluid

Decision date: 2026-10-21.

Fluid is the official motion language for `seam-react`. The first production
migration covers Button, Input, Switch, Tabs, Dialog, and Toast.

Fluid means:

- feedback begins on press, not release;
- state changes use springs that re-target from the current value;
- surfaces that benefit from grabbing support direct manipulation and velocity
  handoff;
- translucent materials express hierarchy while remaining optional under reduced
  transparency;
- unrelated states use fast out-in sequencing;
- reduced motion removes spatial movement without removing comprehension.

Tactile and Expressive remain design references, not public motion modes. Do not
add a user-facing style selector or parallel component variants for them.

## Motion gate

Every animation must pass all four questions before implementation.

### 1. Frequency

| Frequency                 | Default                                       |
| ------------------------- | --------------------------------------------- |
| Hundreds of times per day | No animation                                  |
| Tens of times per day     | Immediate or near-imperceptible feedback only |
| Occasional                | Standard enter, exit, and state transitions   |
| Rare or first-time        | May use the expressive tier                   |

Keyboard access is mandatory, but keyboard invocation alone does not determine
frequency. Judge the action, not only the input device. A command palette
opened hundreds of times remains effectively instant; an occasional dialog may
still animate when opened from the keyboard.

### 2. Purpose

Name one purpose:

- feedback;
- spatial consistency;
- state indication;
- preventing a jarring change;
- explanation;
- delight, only in the rare or first-time tier.

Decorative motion stays out of dense functional data. If the purpose cannot be
named, remove the animation.

### 3. Function

Motion must help the user understand origin, state, progress, or completion.
It must never delay an action, block interaction, or replace a necessary static
cue.

### 4. Cost

Choose the cheapest implementation that meets the behavior. Verify duration,
rendering cost, bundle impact, and interruption behavior before calling the
work complete.

## Motion grammar

### Timing tokens

These are semantic starting points, not per-component exceptions:

| Token           | Range     | Use                                                   |
| --------------- | --------- | ----------------------------------------------------- |
| `fast`          | 100–120ms | Press feedback and tiny state changes                 |
| `base`          | 140–180ms | Hovers, color changes, switches, and compact controls |
| `control`       | 180–220ms | Tabs, menus, popovers, and local movement             |
| `overlay-enter` | 220–260ms | Standard dialogs and sheets                           |
| `overlay-exit`  | 160–220ms | Leaving overlay surfaces                              |
| `expressive`    | 360–480ms | Explicit, rare, spatially meaningful effects          |

The names above are target semantics. Add a token to the shared stylesheet before
referencing it from component CSS; do not ship undefined or component-local
parallel token names.

Normal interaction motion stays within the standard control and overlay ranges.
Anything longer belongs to the expressive tier and must state why the extra
time is useful.

Use asymmetric timing when it helps the interaction read correctly. Entry may
establish context; exit often completes faster once the decision is clear.

### Easing tokens

Use strong, shared curves:

```css
--uk-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--uk-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--uk-ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

- Enter and exit use `ease-out`.
- On-screen movement and morphing use `ease-in-out`.
- Hover and color changes use a short eased transition.
- Continuous progress uses `linear`.

`ease-in` is not a default UI entrance curve. Custom curves must be shared and
documented rather than repeated as literal values.

### Physical defaults

- Enter from a visible state: use opacity with `scale(0.95–0.97)`.
- Anchored surfaces scale from their trigger origin.
- Dialogs remain centered; they are not anchored to their trigger.
- Exit along the same spatial path as entry.
- Springs are the default for state changes that can be interrupted. Use a
  critically damped spring unless user velocity justifies momentum or bounce.

### Transition sequencing

Fast out-in is the default for state replacement and overlay lifecycle:

- On overlay open, establish the dimmed context first, then bring in the
  surface. Use roughly 70–110ms for the context layer and begin the surface
  immediately after or with only a small overlap.
- On overlay close, remove the surface first, then clear the context layer.
  Pointer and focus access end when exit begins; the scrim may finish slightly
  later.
- On content replacement, remove the outgoing content before placing the
  incoming content. Use a short exit around 90–130ms and an enter around
  160–220ms.
- Keep one focal movement dominant. A panel and a moving background should not
  compete for attention with equally strong motion.
- Preserve a short perceptual beat between phases so the material and spatial
  relationship can register. The sequence should still feel immediate; do not
  make the user wait for a spring's mathematical settle before enabling the
  next action.

Out-in is not universal. Shared-layout continuity, a directly manipulated
surface, or two states that must be visibly connected may need synchronized
motion instead. Choose it only when overlapping states would communicate the
wrong relationship.

With reduced motion, replace staged spatial sequencing with one short opacity
cross-fade. Do not preserve artificial waits.

### Component recipes

| Surface          | Default motion                                                                |
| ---------------- | ----------------------------------------------------------------------------- |
| Button           | `scale(0.97)` press feedback, 100–160ms                                       |
| Input            | Border, shadow, and color feedback with a continuous focus cue                |
| Switch           | Direct, interruptible thumb spring with synchronized track color              |
| Tabs             | Spring indicator plus fast out-in content replacement                         |
| Dialog           | Centered spring entrance and exit; the panel remains stationary               |
| Toast            | Same-edge spring entrance and interruptible presence and queue changes        |
| Popover and menu | Trigger-origin opacity and scale                                              |
| Drawer           | Same-edge transform, interruptible, optional drag spring                      |
| Accordion        | Limited height or layout transition with content-aware performance validation |

The `center-morph` exploration is not part of the initial production migration.
It remains a reference for a future explicitly requested signature effect.

## Implementation boundary

### CSS

Use CSS transitions or `@starting-style` for:

- hover, press, color, border, shadow, and focus feedback;
- deterministic state changes controlled by attributes or classes;
- motion that must remain smooth while the main thread is busy;
- simple entry transitions that do not require an exit lifecycle.

Use explicit transition properties. `transition: all` is not allowed.

### Motion

Use `motion/react` for:

- exit animations and presence state;
- overlays that must remain in the DOM while leaving;
- dynamic queues such as Toast;
- shared layout or measured origin;
- springs, gestures, drag, and interruption.

Motion improves orchestration; it does not replace HTML semantics. Dialogs
continue to use the native `<dialog>` foundation unless a recorded decision
changes that contract.

### Framework boundary

- Animate `transform`, `opacity`, and justified `clip-path` changes.
- Avoid animating layout properties without a documented reason.
- Do not drive animations through one React state update per frame.
- Add `will-change` only after a measured reason.
- Keep blur modest and test it in Safari.
- Keep CSS and Motion on one semantic token vocabulary.
- Do not expose new props for raw Motion configuration until a repeated use
  case proves the API is needed.

For unrelated content states inside a stable container, use
`AnimatePresence mode="wait"` with a stable key so the outgoing state completes
before the incoming state enters. Keep its exit short. Use shared layout or
synchronized transitions when the relationship between both states is the point
of the interaction.

### Dialog presence

AnimatePresence is the default orchestration mechanism for Dialog exits:

- keep AnimatePresence mounted outside the conditional Dialog layer;
- use a stable child key;
- keep the native dialog open until the exit phase completes;
- keep the Dialog stationary during interaction; dismissal uses explicit
  controls, Escape, or the backdrop;
- route Escape, backdrop, and close-button actions through one close request;
- use presence state to make the exiting layer inert;
- keep focus trapping and body-scroll locking alive for the complete visible
  lifecycle;
- preserve the existing protected-close behavior when closing is disabled.

## Accessibility contract

Every component includes these behaviors in its first complete version:

- native element semantics before custom ARIA;
- keyboard access for every pointer action;
- visible `:focus-visible` treatment;
- focus entry, containment, and restoration for modal surfaces;
- accessible names and descriptions for icon-only or visual-only states;
- disabled, invalid, loading, and busy states exposed correctly;
- touch-safe hit areas and pointer behavior.

For reduced motion:

- remove positional movement, folding, scaling, and bounce;
- preserve a short opacity or color transition when it improves comprehension;
- keep state and lifecycle callbacks independent of the shortened animation.

Hover motion is gated for devices with hover and a fine pointer. Focus styling
is never gated behind hover support.

## Component contract

Before implementation, a new component must define:

1. Its semantic purpose and the closest native element.
2. Its visual states and interaction states.
3. Controlled and uncontrolled behavior, if applicable.
4. Public API and composition model.
5. Keyboard and focus behavior.
6. Responsive and content-overflow behavior.
7. Motion frequency, purpose, and chosen driver.
8. Light/dark, reduced-motion, and touch behavior.
9. Test cases and documentation examples.

Prefer composition over a large prop surface. Prefer extending an existing
primitive when the semantics and lifecycle are shared.

## Existing component changes

Before modifying an existing component:

- identify consumers and public API compatibility;
- inspect current tests and accessibility guarantees;
- reuse the established behavior unless the task explicitly changes it;
- update related docs and demos;
- keep unrelated visual changes out of the patch.

An existing coarse token or interaction may be migrated when the touched
component needs the change. Do not broaden a focused fix into a full design
system refactor without explicit scope.

One-off timing, easing, origin, or spring values are exceptions. Record the
reason beside the implementation and fold the value back into the shared system
when a second use appears.

## Third-party design references

Community skills, component libraries, and motion examples are inputs to
judgment, not project APIs.

- Adapt patterns to the existing React, native HTML, CSS layer, and token model.
- Pin external skill versions or commits when they become part of the workflow.
- Preserve license attribution when substantial source or text is reused.
- Reconcile conflicts with this document through an explicit design decision.
- Do not install every available skill into the default agent context.

The most relevant review lenses are animation construction, animation review,
performance diagnosis, opportunity finding, and multi-direction prototyping.
Use them selectively at the stage where they apply.

## Prototype protocol

Create an isolated prototype before production implementation when the change
introduces a new interaction language, has several credible visual directions,
or affects multiple components.

- Present three genuinely different directions, not cosmetic variants.
- Name the axis of each direction, such as quiet, tactile, or expressive.
- Use realistic content and the actual component stack.
- Make every direction interactive and accessible.
- Show one full-size direction at a time.
- Stop for the user's selection before integrating.

The picker itself is tooling and receives no decorative animation.

## Review checklist

A component or motion change is ready only when every applicable item passes.

### Intent

- [ ] The component has a clear semantic purpose.
- [ ] Every animation has a named purpose and frequency tier.
- [ ] High-frequency actions remain immediate.

### Interaction

- [ ] Entry and exit tell one coherent spatial story.
- [ ] Rapid repeated actions remain interruptible and stable.
- [ ] Pointer, touch, and keyboard produce equivalent outcomes.
- [ ] Loading, disabled, invalid, empty, and overflow states are defined.

### Motion craft

- [ ] Duration, easing, distance, and scale use shared semantic values.
- [ ] Enter and exit origins are physically appropriate.
- [ ] Controls use near-imperceptible feedback rather than entrance theater.
- [ ] Signature or experimental motion does not leak into standard components.

### Accessibility

- [ ] Focus, names, roles, and states work with assistive technology.
- [ ] Reduced motion removes spatial movement while preserving clarity.
- [ ] Hover motion is capability-gated; focus is always available.
- [ ] Exiting content becomes inert and cannot be operated accidentally.

### Performance

- [ ] The browser output is inspected on a representative device.
- [ ] Animation properties and thread behavior have been checked.
- [ ] Motion dependency is externalized from the package build.
- [ ] Bundle impact and duplicate runtime risk have been assessed.

### Delivery

- [ ] Unit and interaction tests cover the changed behavior.
- [ ] Docs and examples describe the final API and edge cases.
- [ ] Automated checks and the relevant package build pass.
- [ ] User-visible package changes include release metadata.
