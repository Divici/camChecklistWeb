```markdown
# Design System Document: The Sonic Workspace

## 1. Overview & Creative North Star
### Creative North Star: "The Auditory Architect"
This design system moves beyond the generic "productivity app" aesthetic to create a high-end, editorial experience centered on the human voice. We treat audio data not as a file, but as a living architectural element. 

Instead of a rigid grid of boxes, "The Auditory Architect" utilizes **intentional asymmetry** and **tonal depth**. We break the "template" look by using exaggerated typographic scales and overlapping surfaces that mimic the fluid nature of sound waves. The interface should feel like a premium digital concierge: quiet when idle, and vibrantly responsive when engaged.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
Our palette is rooted in Material Design logic but executed with editorial sophistication.

### Color Strategy
*   **Primary (Action Blue - `#0040a1`):** Use for high-intent actions. To add "soul," never use it purely flat; apply a subtle gradient to `primary_container` (`#0056d2`) for a sense of tactile curvature.
*   **Secondary (Success Green - `#1b6d24`):** Used strictly for "Completion" and "Verified" states.
*   **Tertiary (Alert Orange/Recording - `#773200`):** This is our "Active" state. When recording, use `tertiary_container` (`#9d4400`) to signal a warm, high-energy environment.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning content. Boundaries are defined solely through background shifts.
*   **Surface Hierarchy:** Use `surface_container_lowest` for the main background. Nest interactive cards using `surface_container_low`. For floating elements or high-priority inputs, use `surface_bright`.
*   **The Glass & Gradient Rule:** For the recording HUD (Heads-Up Display), use `surface_variant` at 60% opacity with a `20px` backdrop-blur. This "Glassmorphism" ensures the UI feels integrated into the user's workflow rather than "pasted on."

---

## 3. Typography: Editorial Authority
We pair **Manrope** (Display/Headline) with **Inter** (Body/Labels) to create a sophisticated hierarchy that prioritizes legibility on small screens.

*   **Display LG (Manrope, 3.5rem):** Reserved for "Zero State" headers or large time-counters. Use a negative letter-spacing of `-0.02em` for a premium feel.
*   **Headline MD (Manrope, 1.75rem):** Used for task titles. This provides the "Editorial" weight that distinguishes a premium app.
*   **Body LG (Inter, 1rem):** The workhorse for voice-to-text transcripts. High line-height (1.6) is mandatory to ensure accessibility for mobile users on the move.
*   **Label SM (Inter, 0.6875rem):** All-caps with `0.05em` letter-spacing for metadata like "Timestamp" or "File Size."

---

## 4. Elevation & Depth: Tonal Layering
We reject traditional "drop shadows" in favor of **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface_container_highest` element should only ever sit on a `surface_container_low` base. This creates a soft, natural lift.
*   **Ambient Shadows:** If a floating action button (FAB) requires a shadow, use a blur of `24px` with the color `on_surface` at 6% opacity. This mimics natural light.
*   **The Ghost Border:** For accessibility in low-contrast environments, use `outline_variant` at 15% opacity. Never use 100% opaque borders.

---

## 5. Components: Tactile & Accessible
Mobile-first means large touch targets (minimum 48dp) and fluid transitions.

### Buttons
*   **Primary:** `rounded-xl` (1.5rem), using a gradient from `primary` to `primary_container`. Height: `3.5rem`.
*   **Recording FAB:** A large circular button (`full` roundedness). When active, it triggers a `pulse` animation using `tertiary_fixed_dim` with a 40% opacity expansion ring.

### Cards & Lists
*   **The "No-Divider" Rule:** Forbid 1px dividers between list items. Use a `spacing-3` (1rem) vertical gap and a subtle shift to `surface_container_low` on tap/hover.
*   **Voice Waveform Card:** Use `surface_container_highest` with `rounded-lg` corners. Ensure the content has `1.4rem` (spacing-4) internal padding.

### Input Fields
*   **Active State:** Instead of a border, use a thick `2px` underline of `primary` and shift the background of the input to `surface_container_high`.
*   **Error State:** Use `error` text with a `surface_container_lowest` background to ensure the red remains legible and authoritative.

### Signature Component: The "Sonic Pulse"
A custom interaction for the "Active/Recording" state. The background of the entire app should subtly transition to a `tertiary_fixed` tint, signaling a "Focus Mode" while the user speaks.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical spacing (e.g., more top padding than bottom) to create a professional editorial look.
*   **Do** prioritize the `body-lg` size for any transcribed text to ensure high accessibility.
*   **Do** use `surface_tint` for subtle brand presence in empty states.

### Don’t
*   **Don't** use pure black (`#000000`) for text; always use `on_surface` (`#181c1e`) to maintain visual softness.
*   **Don't** use the `none` roundedness setting. This system thrives on the softness of `0.75rem` (md) and `1rem` (lg) corners.
*   **Don't** use standard system alerts. Use custom-styled `surface_container_highest` modals with diffused ambient shadows.

---
**Director’s Note:** Remember, this design system is about the *space between* the elements. Let the typography breathe and let the background colors define the structure. We are building an instrument, not a spreadsheet.```