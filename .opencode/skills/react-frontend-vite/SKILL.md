---
name: react-frontend-vite
description: >
  Standard patterns for React + TypeScript + Vite development.
  Trigger: When starting new React components, editing frontend code, or refactoring UI.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Critical Patterns

- **Architecture**: Functional components and Hooks only.
- **Strict Typing**: All interfaces/types must be defined. Avoid `any`.
- **Vite Native**: Use `import.meta.env` for environment variables. Use absolute paths based on `paths` config (e.g., `@/components/...`).
- **Modifications**: Do NOT change code directly. Use `// SUGGESTION: [your code/change]` or blocked comments for user approval.

## Protocol for Changes

When proposing changes, always follow this format:

```typescript
// SUGGESTION: Refactor to use custom hook
// const [data, setData] = useState(...)
// becomes
// const { data } = useFetch(...)
```

## Resources

- **Vite Docs**: [https://vitejs.dev/guide/](https://vitejs.dev/guide/)
- **React Docs**: [https://react.dev/](https://react.dev/)
