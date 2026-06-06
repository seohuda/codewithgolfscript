#!/usr/bin/env bash
# ============================================================
#  auto-commit.sh
#  CODE WITH GOLFSCRIPT | GolfOnlineJudge
#
#  Watches the project directory and, every 5 minutes, commits
#  any pending changes with a timestamped message that includes
#  a short summary of the changed files.
#
#  Usage:
#    chmod +x auto-commit.sh
#    ./auto-commit.sh            # run in the foreground
#    nohup ./auto-commit.sh &    # run in the background
#
#  Stop a background run:
#    kill "$(cat .auto-commit.pid)"
# ============================================================

set -u

# Interval between checks, in seconds (5 minutes).
INTERVAL="${AUTO_COMMIT_INTERVAL:-300}"

# Resolve the directory this script lives in and operate there.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || {
  echo "auto-commit: failed to enter project directory: $SCRIPT_DIR" >&2
  exit 1
}

LOG_FILE="$SCRIPT_DIR/auto-commit.log"
PID_FILE="$SCRIPT_DIR/.auto-commit.pid"

# Record our PID so a background run can be stopped cleanly.
echo "$$" > "$PID_FILE"

log() {
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[$ts] $*" | tee -a "$LOG_FILE"
}

# Ensure we are inside a git repository.
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "Not a git repository. Initializing one now."
  git init -b main >/dev/null 2>&1 || git init >/dev/null 2>&1
fi

# Gracefully clean up on exit.
cleanup() {
  log "auto-commit stopping (pid $$)."
  rm -f "$PID_FILE"
  exit 0
}
trap cleanup INT TERM

log "auto-commit started (pid $$). Interval: ${INTERVAL}s. Directory: $SCRIPT_DIR"

while true; do
  # Detect whether there is anything to commit (staged, unstaged, or untracked).
  if [ -n "$(git status --porcelain)" ]; then
    # Build a short summary of changed paths (max 5 entries).
    CHANGED_COUNT="$(git status --porcelain | wc -l | tr -d ' ')"
    SUMMARY="$(
      git status --porcelain \
        | awk '{ $1=""; sub(/^ /, ""); print }' \
        | head -n 5 \
        | paste -sd ', ' -
    )"

    if [ "$CHANGED_COUNT" -gt 5 ]; then
      SUMMARY="${SUMMARY}, +$((CHANGED_COUNT - 5)) more"
    fi

    STAMP="$(date '+%Y-%m-%d %H:%M')"

    git add -A

    # Commit. The message keeps the requested format and appends a summary.
    if git commit -m "Auto-commit: ${STAMP} (Automated build)" \
                  -m "Changed (${CHANGED_COUNT}): ${SUMMARY}" >/dev/null 2>&1; then
      log "Committed ${CHANGED_COUNT} change(s): ${SUMMARY}"
    else
      log "Nothing committed (commit returned non-zero; possibly empty or hook rejected)."
    fi
  else
    log "No changes detected."
  fi

  sleep "$INTERVAL"
done
