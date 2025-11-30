---
inclusion: always
---

# Component Building Standards

## Always Check Before Building

When creating or modifying components, ALWAYS:

1. **Search for existing components first**
   - Use grepSearch to find similar components in `frontend/components/`
   - Check if functionality already exists that can be reused
   - Look for patterns in existing components to maintain consistency

2. **Check for refactored component structure**
   - Many components have been refactored into modular structures with:
     - Main component file (e.g., `ComponentName/ComponentName.tsx`)
     - `components/` subfolder for sub-components
     - `hooks/` subfolder for custom hooks
     - `utils/` subfolder for helper functions
     - `types.ts` for TypeScript interfaces
     - `index.tsx` as the export entry point
   - Examples: `Carousel/`, `CategoryForm/`, `ContentForm/`, `Header/`, `HomepageSectionForm/`, `ImageManager/`

3. **Follow existing patterns**
   - Use the same folder structure as refactored components
   - Keep components modular and focused
   - Extract reusable logic into custom hooks
   - Separate utility functions into utils files
   - Define types in dedicated type files

## Component Structure Pattern

For complex components, use this structure:
```
ComponentName/
├── ComponentName.tsx          # Main component
├── index.tsx                  # Export entry point
├── types.ts                   # TypeScript interfaces
├── components/                # Sub-components
│   ├── SubComponent1.tsx
│   └── SubComponent2.tsx
├── hooks/                     # Custom hooks
│   ├── useComponentLogic.ts
│   └── useComponentState.ts
└── utils/                     # Helper functions
    └── helpers.ts
```

## Key Principles

- **DRY (Don't Repeat Yourself)**: Reuse existing components and utilities
- **Modularity**: Break down complex components into smaller, focused pieces
- **Consistency**: Follow the patterns established in the codebase
- **Type Safety**: Always define proper TypeScript types
- **Accessibility**: Ensure components are accessible (see ACCESSIBILITY.md)
