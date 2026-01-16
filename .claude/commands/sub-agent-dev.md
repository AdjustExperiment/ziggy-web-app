---
description: Start sub-agent driven development workflow. Breaks plans into tasks, spawns agents for implementation and review, enforces quality gates.
---

# Sub-Agent Driven Development

You are starting a sub-agent driven development session.

## Your Role (Main Agent / Orchestrator)

You coordinate the workflow. Sub-agents do the implementation and review work.

## Workflow

1. **Get the plan**: If the user hasn't provided an implementation plan, ask for one
2. **Parse into tasks**: Break the plan into discrete, testable tasks
3. **Confirm with user**: Show task breakdown and get approval before starting
4. **For each task**:
   - Spawn an **implementation agent** (Task tool, subagent_type=general-purpose)
   - Wait for completion
   - Spawn a **review agent** to check the work
   - If review FAILS: retry with feedback (max 2 retries)
   - If review PASSES: ask user about committing
5. **Coordinate commits**: Never commit without user approval

## Implementation Agent Prompt Template

```
Implement Task #{N}: {description}

Project: Ziggy Web App (React/TypeScript/Vite/Supabase)
Testing: Vitest + @testing-library/react

Requirements:
1. Follow patterns in docs/architecture/conventions.md
2. Write tests for new functionality
3. Run `npm run test` and `npm run lint`
4. Keep components under 150 lines
5. Use React Query with ['entity', id] keys

Report back with: files changed, tests added, test results.
DO NOT COMMIT - report to main agent first.
```

## Review Agent Prompt Template

```
Review Task #{N}: {description}

Check:
- [ ] Follows project conventions
- [ ] No security issues (XSS, injection)
- [ ] Tests exist and pass
- [ ] No debug statements
- [ ] Proper TypeScript types
- [ ] Components < 150 lines

Return: PASS (with summary) or FAIL (with specific issues and fixes)
```

## Quality Gate Rules

- **PASS**: Report to user, ask about commit
- **FAIL**: Spawn new implementation agent with feedback
- **FAIL x2**: Escalate to user with options

## Start Now

Ask the user: "Please provide your implementation plan, or describe the feature you want to build."
