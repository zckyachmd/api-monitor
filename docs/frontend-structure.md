# Frontend Structure (React + Inertia, small project)

This project uses React with Inertia.js under Laravel + Vite. The folder layout aims to stay simple and consistent for a small codebase while keeping room for growth.

Structure overview:

```
resources/js/
  app.tsx                 # Inertia entry, dynamic page resolver
  pages/                  # Route-level screens (Inertia pages)
    Dashboard.tsx         # dashboard feature modules live under pages/dashboard/
    Auth/
      Login.tsx
    Reports/
      Overview.tsx        # reports feature modules live under pages/Reports/
  layouts/                # Page layouts (wrappers)
    AdminLayout.tsx
    AuthLayout.tsx
  components/             # Reusable UI building blocks
    layout/               # Navbar, footer, etc.
    theme/                # Theme toggles, providers
    ui/                   # Low-level UI primitives (buttons, inputs, etc.)
  lib/                    # Utilities/helpers
  types/                  # Shared types
```

Guidelines:

- Use lowercase directory names for consistency (`pages`, `components`, `layouts`).
- Keep route-level code inside `pages/` following the Inertia name used by the server, e.g. `Inertia::render('Reports/Overview') -> resources/js/pages/Reports/Overview.tsx`.
- Co-locate page modules per feature:
  - Dashboard page modules under `pages/dashboard/*` (lowercase folder next to the page file).
  - Reports page modules under `pages/Reports/*` (same folder as the page, matching Inertia segment).
- Use the Vite alias `@` (configured to `resources/js`) for imports, e.g. `@/pages/Reports/components/Tables`.
- Keep generic, reusable components in `components/ui`; layout-affecting parts in `components/layout` or inside the corresponding layout if tightly coupled.
- Place cross-cutting helpers in `lib/` and shared TypeScript types in `types/`.
- If a page grows, create a local folder under `pages/<feature>/` and co-locate small, page-only components next to it as needed.

This keeps things straightforward today without locking us out of a feature-based structure if the project grows.
