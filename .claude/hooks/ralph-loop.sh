#!/bin/bash
# Ralph Loop stop hook
# Checks if Claude completed the task. If not, blocks the stop and continues the loop.

INPUT=$(cat)
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // "."')

# Only activate when a Ralph Loop is running
if [ ! -f "$PROJECT_DIR/ralph-progress.md" ]; then
  exit 0
fi

# Prevent infinite meta-loops
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

LAST_MESSAGE=$(echo "$INPUT" | jq -r '.last_assistant_message // ""')

if echo "$LAST_MESSAGE" | grep -q "RALPH_DONE"; then
  exit 0
fi

jq -n '{
  "decision": "block",
  "reason": "Ralph Loop: task not complete. Read ralph-progress.md for context from your prior iteration, then continue working on the task. Run all verification checks before finishing."
}'
