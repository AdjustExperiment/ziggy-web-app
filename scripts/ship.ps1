param(
  [Parameter(Mandatory = $true)]
  [string]$BranchName,

  [string]$CommitMessage = "chore: ship",

  [ValidateSet("squash", "merge", "rebase")]
  [string]$MergeMethod = "squash"
)

$ErrorActionPreference = "Stop"

function Require($cmd) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $cmd"
  }
}

Require git
Require npm
Require gh

git checkout -b $BranchName

npm run lint
npm test -- --run
npm run typecheck
npm run build

git add -A
git commit -m $CommitMessage
git push -u origin $BranchName

# Create PR and enable auto-merge (no manual approvals needed if GitHub branch rules don’t require them)
gh pr create --fill
gh pr merge --auto --$MergeMethod --delete-branch

Write-Host "PR created and set to auto-merge when checks are green."


