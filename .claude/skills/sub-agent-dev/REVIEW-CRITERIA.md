# Code Review Criteria

Review agents should check all applicable items. Mark as FAIL if any critical item fails.

## Critical (Must Pass)

### Security
- [ ] No XSS vulnerabilities (unsanitized user input in DOM)
- [ ] No SQL injection (use parameterized queries)
- [ ] No secrets/credentials in code
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] Auth checks on protected routes/actions

### Functionality
- [ ] Code does what the task requires
- [ ] No obvious logic errors
- [ ] Error states handled appropriately
- [ ] Loading states handled (no flash of undefined)

### Tests
- [ ] Tests exist for new functionality
- [ ] Tests actually test the behavior (not just coverage)
- [ ] All tests pass (`npm run test`)
- [ ] No skipped tests without explanation

## Important (Should Pass)

### Code Quality
- [ ] No `console.log` or debug statements
- [ ] No commented-out code blocks
- [ ] No `any` type abuse in TypeScript
- [ ] Proper error messages (not generic "Error occurred")
- [ ] No magic numbers/strings (use constants)

### Project Conventions (Ziggy-specific)
- [ ] Components under 150 lines
- [ ] React Query keys follow `['entity', id]` pattern
- [ ] Hooks return structured objects `{ data, isLoading, error, ...actions }`
- [ ] Realtime subscriptions have cleanup
- [ ] Follows existing file/folder structure

### Performance
- [ ] No obvious N+1 query patterns
- [ ] Large lists use virtualization or pagination
- [ ] Images have appropriate sizing
- [ ] No unnecessary re-renders (missing deps, inline objects)

## Minor (Nice to Have)

### Style
- [ ] Consistent naming conventions
- [ ] Logical code organization
- [ ] Clear variable/function names
- [ ] Appropriate use of comments (why, not what)

### Maintainability
- [ ] Single responsibility principle
- [ ] DRY (but don't over-abstract)
- [ ] Easy to understand without deep context

## Review Output Format

### On PASS
```
## PASS

### Summary
[What was implemented and reviewed]

### Files Reviewed
- path/to/file.tsx (N lines changed)

### Minor Suggestions (non-blocking)
- [Optional improvements for future]
```

### On FAIL
```
## FAIL

### Critical Issues
1. **[Category]** path/to/file.tsx:123
   - Issue: [description]
   - Fix: [specific suggestion]

2. **[Category]** path/to/file.tsx:456
   - Issue: [description]
   - Fix: [specific suggestion]

### Files Reviewed
- path/to/file.tsx (N lines changed)

### What Must Change
[Numbered list of required fixes before re-review]
```

## Common Failure Patterns

### 1. Missing Error Handling
```typescript
// BAD
const data = await fetch(url);
return data.json();

// GOOD
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
} catch (error) {
  console.error('Fetch failed:', error);
  throw error;
}
```

### 2. Unsafe Type Assertions
```typescript
// BAD
const user = data as User;

// GOOD
if (isUser(data)) {
  const user = data;
}
```

### 3. Missing Loading States
```typescript
// BAD
return <div>{data.name}</div>;

// GOOD
if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
return <div>{data.name}</div>;
```

### 4. Stale Closure in Effects
```typescript
// BAD
useEffect(() => {
  const interval = setInterval(() => {
    setCount(count + 1); // stale closure
  }, 1000);
  return () => clearInterval(interval);
}, []);

// GOOD
useEffect(() => {
  const interval = setInterval(() => {
    setCount(c => c + 1); // functional update
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

### 5. Missing Cleanup
```typescript
// BAD
useEffect(() => {
  const subscription = channel.subscribe();
  // no cleanup!
}, []);

// GOOD
useEffect(() => {
  const subscription = channel.subscribe();
  return () => subscription.unsubscribe();
}, []);
```
