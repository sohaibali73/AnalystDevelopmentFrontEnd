# Analyst by Potomac - System Guidelines

<!--
These guidelines ensure AI-generated code and components maintain consistency with the Analyst by Potomac design system and user experience standards.
-->

## General Guidelines

* Use React with TypeScript for all components
* Keep components modular and reusable - extract helper functions and sub-components into separate files
* Use semantic HTML elements for accessibility
* Implement proper error boundaries and error handling for all user-facing features
* Always include loading states with appropriate spinners or skeleton screens
* Ensure all interactive elements have minimum 44px touch targets for mobile
* Use React.memo, useCallback, and useMemo for performance optimization
* Implement proper keyboard navigation (Tab, Enter, Escape, Arrow keys)
* Include ARIA labels and roles for screen reader support
* Never rely on placeholder text alone - always use proper labels
* Maintain WCAG AA color contrast ratios (4.5:1 for normal text, 3:1 for large text)

---

## Design System Guidelines

### Colors

**Dark Theme (Default)**
* Background: `#121212`
* Card Background: `#1E1E1E`
* Input Background: `#2A2A2A`
* Border: `#424242`
* Text Primary: `#FFFFFF`
* Text Muted: `#9E9E9E`
* Accent: `#FEC00F` (Potomac Yellow - use sparingly for emphasis)
* Success: `#22C55E`
* Error: `#DC2626`
* Warning: `#FF9800`

**Light Theme**
* Background: `#FFFFFF`
* Card Background: `#F8F9FA`
* Input Background: `#F5F5F5`
* Border: `#E0E0E0`
* Text Primary: `#212121`
* Text Muted: `#757575`

### Typography

* **Headings**: Use Rajdhani font, 700 weight, uppercase, with 1-2px letter-spacing
* **Body Text**: Use Quicksand font, 400-600 weight
* **Code**: Use monospace fonts (Fira Code, Monaco, Consolas)
* **Mobile Heading Sizes**: Reduce by ~50% (48px → 24px)
* **Line Heights**: 1.5 for body text, 1.2 for headings

### Spacing & Layout

* Base padding: 32px desktop, 24px tablet, 16px mobile
* Border radius: 8-12px for cards, 6-8px for buttons/inputs
* Grid gaps: 24px desktop, 16px mobile
* Maximum content width: 1200px for readability
* Use CSS Grid and Flexbox for layouts - avoid absolute positioning unless necessary

### Component Patterns

#### Buttons
* Primary: Yellow background (`#FEC00F`), dark text (`#212121`)
* Secondary: Transparent background, yellow border, yellow text
* Danger: Red border and text (`#DC2626`)
* Minimum height: 44px
* Padding: 12px 24px
* Transition: all 0.2s ease
* Hover: opacity 0.9 or slight background change
* Active: scale(0.98)
* Disabled: opacity 0.6, cursor not-allowed

#### Cards
* Background: `#1E1E1E` (dark) / `#F8F9FA` (light)
* Border radius: 12px
* Padding: 24px
* Border: 1px solid `#424242` (dark) / `#E0E0E0` (light)
* Hover: border-color changes to `#FEC00F`, add subtle shadow
* Transition: all 0.3s ease

#### Input Fields
* Background: `#2A2A2A` (dark) / `#F5F5F5` (light)
* Border: 1px solid `#424242` (dark) / `#E0E0E0` (light)
* Border radius: 8px
* Padding: 12px 16px
* Focus: 2px yellow border with glow effect (`box-shadow: 0 0 0 3px rgba(254, 192, 15, 0.2)`)
* Remove default outline on focus

#### Icons
* Default size: 20px for inline, 24px for buttons, 32px+ for emphasis
* Use lucide-react icon library
* Color: inherit from parent or use theme text colors
* Include ARIA labels for accessibility

---

## Layout & Navigation

### Sidebar Navigation
* Width: 256px expanded, 80px collapsed, 0px on mobile
* Transition: width 0.3s ease
* Background: `#1E1E1E` (dark) / `#FFFFFF` (light)
* Items: 48px height, 12px padding
* Active state: Yellow background with reduced opacity
* Hover: Background color change
* Show tooltips when collapsed
* Include collapse/expand button with ChevronLeft/ChevronRight icons

### Mobile Navigation
* Use hamburger menu icon (Menu from lucide-react)
* Full-screen overlay with backdrop
* Close on backdrop click or Escape key
* Sticky header with logo and menu toggle

### Responsive Breakpoints
* Mobile: < 768px
* Tablet: 768px - 1024px
* Desktop: > 1024px

---

## Page-Specific Guidelines

### Dashboard
* Use 3-column grid on desktop, 2-column on tablet, 1-column on mobile
* Statistics cards should show large numbers in Rajdhani font
* Feature cards with colored accents (blue, purple, green, orange, yellow)
* Include empty states with large icons (64px) and helpful messages

### AFL Generator
* Split layout: 50/50 on desktop, stacked on mobile
* Input panel minimum textarea height: 200px
* Code display with syntax highlighting:
  - Comments: `#6A9955` (green)
  - Keywords: `#FEC00F` (yellow)
  - Functions: `#DCDCAA`
  - Variables: `#9CDCFE` (blue)
  - Numbers: `#B5CEA8`
* Include line numbers (right-aligned, gray)
* Copy button with success state (Copy → Check icon transition)

### Chat Interface
* Sidebar width: 300px (hidden on mobile)
* User messages: right-aligned, yellow background, rounded (20px 20px 4px 20px)
* AI messages: left-aligned, gray background, rounded (20px 20px 20px 4px)
* Message max-width: 70% of container
* Timestamp format: HH:MM with Clock icon
* Auto-scroll to bottom on new messages
* Input: multi-line (56px min, 200px max), auto-resize
* Keyboard shortcuts: Enter to send, Shift+Enter for new line

### Knowledge Base
* Drag & drop area: 2px dashed border, hover changes to yellow
* Document cards: FileText icon in yellow, metadata in gray
* Search results: show relevance score as percentage
* File size formatting: B/KB/MB with appropriate units
* Upload progress: animated progress bar with file count

### Backtest Analysis
* Grid layout: 2 columns desktop, 1 column mobile
* Total return: large percentage with arrow indicator (up/down)
* Win rate: blue progress bar
* Max drawdown: red text
* Sharpe ratio: yellow text
* AI insights: Zap icon with yellow accent

---

## Form & Input Guidelines

### Validation
* Show errors below fields with AlertCircle icon
* Use red color for error text and borders
* Validate on blur and submit
* Clear, actionable error messages
* Disable submit button when form is invalid

### File Uploads
* Accept attributes for file types: `.pdf,.txt,.doc,.docx` for documents, `.csv,.json` for data
* Show file size limits clearly (e.g., "Max 100MB")
* Progress indicators for uploads
* List uploaded files with delete option
* Error handling for failed uploads

### Toggles & Switches
* Width: 52px, Height: 28px
* Active background: `#FEC00F`
* Inactive background: `#424242` (dark) / `#E0E0E0` (light)
* Circle size: 24px with 2px margin
* Smooth transition: 0.2s ease
* Include labels and descriptions

---

## Modals & Overlays

### Modal Structure
* Fixed overlay: `rgba(0,0,0,0.7)`
* Centered modal: max-width 600px
* Border radius: 16px
* Padding: 32px
* Close button (X icon) in top-right
* Close on Escape key or backdrop click
* Prevent body scroll when open

### Toast Notifications
* Position: bottom-right on desktop, bottom-center on mobile
* Auto-dismiss after 3-5 seconds
* Include close button
* Types: success (green), error (red), warning (orange), info (blue)
* Slide-in animation from bottom

---

## Animation & Transitions

### Standard Transitions
* Duration: 0.2s for interactions, 0.3s for page transitions
* Easing: `ease` or `ease-in-out`
* Properties: `all`, `opacity`, `transform`, `background-color`, `border-color`

### Loading States
* Spinner: Rotating Loader2 icon from lucide-react
* Bouncing dots: 3 dots with staggered animation
* Skeleton screens: Pulsing gray rectangles matching content shape
* Progress bars: Smooth width transition

### Hover Effects
* Opacity: 0.9 or background color change
* Scale: 1.05 for cards
* Border color: change to `#FEC00F`
* Add subtle shadow: `0 4px 12px rgba(0,0,0,0.1)`

### Focus States
* Yellow border: 2px solid `#FEC00F`
* Glow effect: `box-shadow: 0 0 0 3px rgba(254, 192, 15, 0.2)`
* Remove default browser outline
* Ensure focus is always visible

---

## Code & Syntax Highlighting

### Code Blocks
* Background: `#0D1117` (GitHub dark theme)
* Font: Fira Code, Monaco, Consolas (monospace)
* Font size: 14px
* Line height: 1.6
* Padding: 16px
* Border radius: 8px
* Include language label (uppercase, yellow)
* Add copy button with success state
* Line wrapping for readability
* Scrollable for long code

### Inline Code
* Background: `rgba(254, 192, 15, 0.1)`
* Padding: 2px 6px
* Border radius: 4px
* Font: monospace

---

## Accessibility Checklist

* ✅ All images have alt text
* ✅ All icons have ARIA labels
* ✅ Form fields have associated labels
* ✅ Buttons have descriptive text or aria-label
* ✅ Links are clearly identifiable
* ✅ Color is not the only means of conveying information
* ✅ Focus indicators are visible
* ✅ Tab order is logical
* ✅ Modals trap focus
* ✅ Error messages are announced to screen readers
* ✅ Loading states are announced
* ✅ Success/error states have icons AND text

---

## Performance Best Practices

* Lazy load routes and heavy components
* Use React.memo for components that render frequently with same props
* Implement virtual scrolling for lists with 100+ items
* Debounce search inputs (300ms)
* Optimize images (use SVG for icons)
* Code split by route
* Memoize expensive calculations with useMemo
* Cache API responses where appropriate

---

## Error Handling

### Display Errors Appropriately
* Network errors: Toast notification with retry button
* Validation errors: Inline below fields
* Permission errors: Modal with explanation
* Server errors: Alert component with error code
* Empty states: Large icon with helpful message and CTA

### Error Messages
* Be specific and actionable
* Avoid technical jargon for user-facing errors
* Provide next steps or solutions
* Include support contact for critical errors
* Log errors to console for debugging

---

## Brand Consistency

* Always use "ANALYST BY POTOMAC" in uppercase for branding
* Tagline: "Break the status quo"
* Logo size: 40px × 40px in navigation, 100px × 100px on login
* Accent color (`#FEC00F`) should be used deliberately - not on every element
* Maintain professional, confident tone in all copy
* Use Rajdhani for emphasis, Quicksand for readability