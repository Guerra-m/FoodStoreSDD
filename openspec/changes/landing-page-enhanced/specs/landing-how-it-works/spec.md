## ADDED Requirements

### Requirement: How It Works section with 4-step visual process
The "Cómo funciona" section SHALL display 4 steps of the ordering process (Browse/Explore, Add to Cart, Checkout, Delivered) in a visual, easy-to-understand format. Each step SHALL include an icon/emoji, step number, and brief description (1-2 sentences).

#### Scenario: Four steps of the process are displayed
- **WHEN** user scrolls to "Cómo funciona" section
- **THEN** section displays 4 steps (Browse, Add to Cart, Checkout, Delivered) with icons and descriptions

#### Scenario: Steps are numbered and sequential
- **WHEN** user views the how it works section
- **THEN** each step is clearly numbered (1, 2, 3, 4) and arranged horizontally (desktop) or vertically (mobile) to show progression

#### Scenario: Step layout is responsive
- **WHEN** user views section on mobile
- **THEN** steps stack vertically with clear visual connector lines showing progression

#### Scenario: Step icons are food/order-related
- **WHEN** user views the how it works section
- **THEN** icons are thematic and relevant (e.g., 🛒 for Browse, 🛍️ for Add to Cart, 💳 for Checkout, 🚚 for Delivered)

### Requirement: Visual connector between steps
Steps SHALL be visually connected with lines or arrows to emphasize the sequential process, making the flow obvious even on mobile.

#### Scenario: Visual connectors show progression
- **WHEN** user views how it works section
- **THEN** visual connectors (lines/arrows) guide the eye from step to step
