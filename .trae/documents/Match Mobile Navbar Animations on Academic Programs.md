## Goal
- Make the Academic Programs page use the same mobile navbar/menu + dropdown animation feel as the HomePage when the body has `mobile-menu-open`.

## What’s Causing the Difference
- HomePage’s navbar animation rules are scoped under `.homepage` in [HomePage.css](file:///c:/CodingProjects/ccbwebmain/src/HomePage.css).
- Academic Programs uses `.academic-page` (not `.homepage`), so those HomePage-only animation selectors never apply.
- The mobile menu open state is driven by `body.mobile-menu-open` inside [Navbar.js](file:///c:/CodingProjects/ccbwebmain/src/components/Navbar.js#L14-L24).

## Changes I Will Make
### 1) Update `academicprogram.js`
- Add a `navAnimationsComplete` state (similar to HomePage.js).
- Add a `MutationObserver` that watches `document.body.className` changes:
  - When `mobile-menu-open` is added, set `navAnimationsComplete=false`, then set it back to `true` after the animation window (≈1.7–2.0s).
  - When `mobile-menu-open` is removed, set `navAnimationsComplete=true`.
- Update the root wrapper class to conditionally include `nav-animations-complete` instead of hardcoding it.

### 2) Update `academicprogram.css`
- Copy the relevant keyframes from [HomePage.css](file:///c:/CodingProjects/ccbwebmain/src/HomePage.css#L532-L615) (e.g. `slideInNavLink`, `fadeInOverlay`, `fadeInMobileSecondaryNav`, `fadeInDropdown`, `slideInDropdownItem`, `fadeInButton`).
- Add HomePage-equivalent animation rules, but scoped for the academic page and only when the menu is open:
  - `body.mobile-menu-open .academic-page:not(.nav-animations-complete) ...`
  - Target the same Navbar structure/classes from [Navbar.js](file:///c:/CodingProjects/ccbwebmain/src/components/Navbar.js#L337-L511):
    - `.main-nav.with-bg.homepage-nav-section .mobile-menu-overlay`
    - `.main-nav... .mobile-secondary-nav` and its `.nav-link` children (staggered)
    - `.main-nav... .nav-links > a[href="/"]`, `a[href="/academics"]`, etc. (staggered)
    - `.services-dropdown-container`, `.services-nav-link`, `.dropdown-arrow`, `.services-dropdown`, `.dropdown-item` (staggered)
- Add “final state” rules for when `.academic-page.nav-animations-complete` applies, to ensure everything ends fully visible.

## Verification
- Open the Academic Programs page in a mobile viewport.
- Toggle the hamburger menu:
  - Menu overlay fades in.
  - Mobile secondary links (Students/Faculty/About/Contact) animate in.
  - Main links + Services dropdown area animate in with the same timing/feel as HomePage.
- Repeat open/close to confirm the animation replays on each open.

If you confirm, I’ll implement the CSS + JS changes and validate the behavior locally.