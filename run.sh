#!/bin/bash
# MisMatch dev runner — starts server and client in split terminal panes (requires tmux)

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

if command -v tmux &>/dev/null; then
  SESSION="mismatch"
  tmux new-session -d -s $SESSION -x 220 -y 50 2>/dev/null || true
  tmux send-keys -t $SESSION "cd $ROOT/server && cargo run" Enter
  tmux split-window -h -t $SESSION
  tmux send-keys -t $SESSION "cd $ROOT/client && npm run dev" Enter
  tmux attach -t $SESSION
else
  echo "tmux not found — starting server in background, client in foreground"
  cd "$ROOT/server" && cargo run &
  SERVER_PID=$!
  cd "$ROOT/client" && npm run dev
  kill $SERVER_PID 2>/dev/null
fi
