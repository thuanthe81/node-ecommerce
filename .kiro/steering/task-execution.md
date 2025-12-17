---
inclusion: always
---

# Task Execution Standards

## Before Starting Any Task

### 1. Search and Understand Context
- **Search for related code**: Use grepSearch to find existing implementations
- **Check for patterns**: Look at how similar features are implemented
- **Review related files**: Read components, APIs, and utilities that you'll interact with

### 2. Component Development Checklist
- [ ] Search for existing similar components
- [ ] Check if component structure should be modular (see component-building.md)
- [ ] Identify reusable sub-components
- [ ] Plan custom hooks for complex logic
- [ ] Define TypeScript types

### 3. Translation Checklist
- [ ] Search for existing translation keys that can be reused
- [ ] Add new keys to `frontend/locales/translations.json`
- [ ] Provide both English (`en`) and Vietnamese (`vi`) translations
- [ ] Use `useTranslations()` hook in components
- [ ] Test both language versions

### 4. API Integration Checklist
- [ ] Check existing API client files in `frontend/lib/`
- [ ] Follow existing patterns for API calls
- [ ] Handle loading, error, and success states
- [ ] Add proper TypeScript types for requests/responses

### 5. Testing Checklist
- [ ] Check for existing test utilities in `frontend/__tests__/utils/`
- [ ] Write tests that follow existing patterns
- [ ] Test both happy path and error cases
- [ ] Verify translations work in tests

## Default Search Strategy

When starting a task, use this search approach:

1. **Find similar features**:
   ```
   grepSearch for component names, function names, or feature keywords
   ```

2. **Check component structure**:
   ```
   List directory of similar components to see their organization
   ```

3. **Review translations**:
   ```
   Search translations.json for related keys
   ```

4. **Check API patterns**:
   ```
   Review relevant API client files in frontend/lib/
   ```

## Quality Standards

- **Consistency**: Follow existing patterns in the codebase
- **Completeness**: Include translations, types, error handling
- **Modularity**: Break down complex components
- **Reusability**: Extract common logic into hooks/utils
- **Accessibility**: Follow WCAG guidelines (see ACCESSIBILITY.md)
- **Type Safety**: Proper TypeScript types throughout
- **Code Formatting**: Always use Prettier syntax for consistent code formatting across all files

## Common Pitfalls to Avoid

- ❌ Creating components without checking for existing similar ones
- ❌ Hardcoding English text without translations
- ❌ Ignoring existing component structure patterns
- ❌ Not extracting reusable logic into hooks
- ❌ Missing error handling and loading states
- ❌ Inconsistent naming conventions
- ❌ Not following TypeScript best practices
- ❌ Writing code without proper Prettier formatting
