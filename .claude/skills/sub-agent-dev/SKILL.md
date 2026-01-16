---
name: sub-agent-dev
description: Sub-agent driven development workflow for implementing features from plans. Use when user provides an implementation plan, feature request, or multi-step development task. Breaks work into tasks, spawns sub-agents for each, runs code review, and enforces quality gates.
---

# Sub-Agent Driven Development

A structured workflow for implementing features using isolated sub-agents with automatic quality gates.

## When to Use This Skill

- User provides an implementation plan or feature specification
- Multi-step development tasks requiring isolation
- When you need automatic code review after each task
- Complex features that benefit from task-by-task implementation

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│  1. PARSE PLAN → Extract discrete tasks from user's plan   │
├─────────────────────────────────────────────────────────────┤
│  2. TASK LOOP (for each task):                              │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ a) Spawn Implementation Agent                       │ │
│     │    - Implement the feature/fix                      │ │
│     │    - Write/update tests                             │ │
│     │    - Run tests locally                              │ │
│     │    - Report back to main agent                      │ │
│     ├─────────────────────────────────────────────────────┤ │
│     │ b) Spawn Review Agent                               │ │
│     │    - Review code changes                            │ │
│     │    - Check test coverage                            │ │
│     │    - Verify conventions followed                    │ │
│     │    - Return PASS/FAIL with feedback                 │ │
│     ├─────────────────────────────────────────────────────┤ │
│     │ c) Quality Gate                                     │ │
│     │    - If PASS: Ask main agent about commit           │ │
│     │    - If FAIL: Retry with feedback (max 2 retries)   │ │
│     └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  3. COMPLETION → Summarize all changes, offer final commit  │
└─────────────────────────────────────────────────────────────┘
```

## Instructions

### Step 1: Parse the Implementation Plan

When user provides a plan, extract tasks using this structure:

```markdown
## Task Breakdown

| # | Task | Files Likely Affected | Dependencies |
|---|------|----------------------|--------------|
| 1 | [Task name] | [files] | None |
| 2 | [Task name] | [files] | Task 1 |
```

Present this breakdown to the user and confirm before proceeding.

### Step 2: For Each Task, Spawn Implementation Agent

Use the Task tool with this prompt template:

```
You are implementing Task #{N}: {task_description}

## Context
- Project: Ziggy Web App (React + TypeScript + Vite + Supabase)
- Testing: Vitest with @testing-library/react
- Conventions: See docs/architecture/conventions.md

## Your Task
{detailed_task_description}

## Files to modify/create
{file_list}

## Requirements
1. Implement the feature following existing patterns
2. Write or update tests in the same PR
3. Run `npm run test` to verify tests pass
4. Run `npm run lint` to check for lint errors
5. Keep components under 150 lines
6. Use React Query with ['entity', id] key pattern
7. Follow hook return value conventions

## Output
Report back with:
- Files changed (with line counts)
- Tests added/modified
- Test results (pass/fail)
- Any blockers or questions

DO NOT COMMIT. Report back to main agent first.
```

### Step 3: Spawn Review Agent

After implementation, spawn a review agent:

```
You are reviewing code changes for Task #{N}: {task_description}

## Review Checklist
See [REVIEW-CRITERIA.md](REVIEW-CRITERIA.md) for full criteria.

Quick checks:
- [ ] Code follows project conventions
- [ ] No security vulnerabilities (XSS, injection, etc.)
- [ ] Tests exist and pass
- [ ] No console.log or debug statements left
- [ ] TypeScript types are correct (no `any` abuse)
- [ ] Components are under 150 lines
- [ ] Error handling is appropriate

## Output Format
Return exactly one of:

**PASS**
- Summary of what was reviewed
- Any minor suggestions (non-blocking)

**FAIL**
- Specific issues that must be fixed
- File:line references for each issue
- Suggested fixes
```

### Step 4: Handle Review Results

**On PASS:**
```
Task #{N} passed code review.

Changes ready to commit:
- {file_list}

Should I commit these changes now, or continue to the next task first?
```

**On FAIL (retry up to 2 times):**
```
Task #{N} failed code review. Issues found:
{issues}

Spawning fix agent with feedback...
```

Then spawn a new implementation agent with the feedback included.

**On FAIL after 2 retries:**
```
Task #{N} failed review after 2 retry attempts.

Remaining issues:
{issues}

Options:
1. I'll fix these manually
2. Skip this task and continue
3. Stop and investigate
```

### Step 5: Commit Coordination

When user approves a commit:
- Stage only files related to that task
- Use conventional commit format: `feat(scope): description`
- Include task reference if applicable

## Project-Specific Patterns

### React Query Hooks
```typescript
// Pattern to follow
export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: () => fetchTournament(id),
  });
}
```

### Component Structure
```typescript
// Keep under 150 lines
export function MyComponent({ prop }: Props) {
  // hooks first
  const { data } = useMyQuery();

  // handlers
  const handleClick = () => {};

  // render
  return <div>...</div>;
}
```

### Test Pattern
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

## Full Documentation

- [Workflow Details](WORKFLOW.md)
- [Review Criteria](REVIEW-CRITERIA.md)
