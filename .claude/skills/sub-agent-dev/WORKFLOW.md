# Sub-Agent Workflow Details

## Agent Types and Responsibilities

### Main Agent (Orchestrator)
- Parses implementation plans into tasks
- Spawns and coordinates sub-agents
- Handles quality gate decisions
- Manages commit coordination with user
- Escalates failures to user

### Implementation Agent
- Receives single task scope
- Reads relevant files to understand context
- Implements the feature/fix
- Writes/updates tests
- Runs test suite locally
- Reports results back (NO commits)

### Review Agent
- Receives diff of changes
- Applies review criteria checklist
- Returns PASS or FAIL with specifics
- Does NOT fix code (only reviews)

## Task Isolation Principle

Each sub-agent starts fresh with:
- Full codebase access
- Clear task scope
- No memory of previous tasks
- Explicit context provided in prompt

This ensures:
- Clean separation of concerns
- No accumulated state bugs
- Reproducible results
- Easy retry on failure

## Retry Logic

```
attempt = 0
max_retries = 2

while attempt <= max_retries:
    result = spawn_implementation_agent(task, feedback)
    review = spawn_review_agent(changes)

    if review.passed:
        return SUCCESS
    else:
        feedback = review.issues
        attempt += 1

return ESCALATE_TO_USER
```

## Commit Strategy

### Per-Task Commits (Recommended)
- Commit after each task passes review
- Smaller, focused commits
- Easy to revert individual changes
- Better git history

### Batch Commits (Alternative)
- Complete all tasks first
- Single commit at end
- Useful for tightly coupled changes
- Risk: larger rollback if issues found

## Error Handling

### Implementation Agent Fails
- Check if task scope is too large
- Break into smaller sub-tasks
- Provide more context in prompt

### Review Agent Fails Repeatedly
- Likely architectural issue
- Escalate to user for guidance
- May need plan revision

### Tests Fail
- Implementation agent should report this
- Don't proceed to review until tests pass
- May indicate missing dependencies or setup

## Parallelization (Advanced)

For independent tasks, you CAN spawn multiple implementation agents in parallel:

```
# Only if tasks have NO dependencies
Task tool call 1: Implement Task A
Task tool call 2: Implement Task B  (same message, parallel)
```

Then review sequentially to maintain quality gates.

## Context Management

### What to Include in Agent Prompts
- Task description and scope
- Relevant file paths
- Key patterns to follow
- Test requirements
- What NOT to do

### What to Omit
- Unrelated codebase details
- Previous task history (unless relevant)
- Full file contents (let agent read as needed)

## Metrics to Track

For each task:
- Implementation time (agent duration)
- Review outcome (PASS/FAIL)
- Retry count
- Files changed
- Lines added/removed
- Tests added

Report summary at end of session.
