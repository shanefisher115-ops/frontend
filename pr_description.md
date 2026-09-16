Title: 🧹 refactor theme state management to remove direct DOM manipulation

🎯 **What:**
Refactored theme toggling in `src/components/Dashboard.tsx` from direct DOM querying and manipulation (`document.querySelector` / `innerHTML` / `setAttribute`) to standard React state (`theme`) and declarative JSX conditional rendering.

💡 **Why:**
Direct DOM manipulation in React bypasses React's virtual DOM and component lifecycle, introducing risks of state synchronization bugs and maintenance complexity. Converting theme management to React state improves code health, readability, and maintainability.

✅ **Verification:**
- Ran `npm run typecheck` (0 errors).
- Ran `npm test` (all 17 tests passed across 3 test files, including a new test for clicking the theme toggle button).

✨ **Result:**
Clean, declarative React code for theme state management with zero direct DOM queries or updates inside component callbacks.
