#!/usr/bin/env bash
# Local Postgres for svettebotta development. Data lives in ~/.svettebotta-devdb (outside the
# project, so Turbopack never trips over the socket file). Port 5546, unix socket only.
set -euo pipefail

DEVDB_DIR="$HOME/.svettebotta-devdb"
PGBIN="/opt/homebrew/opt/postgresql@18/bin"
PGDATA="$DEVDB_DIR/data"
SOCKET_DIR="$DEVDB_DIR/sock"
PORT=5546
DB_NAME="svettebotta"

if [ ! -x "$PGBIN/postgres" ]; then
  echo "postgresql@18 not found at $PGBIN. Install it with: brew install postgresql@18" >&2
  exit 1
fi

start() {
  mkdir -p "$SOCKET_DIR"
  if [ ! -d "$PGDATA" ]; then
    echo "Initializing new local Postgres cluster in $PGDATA ..."
    "$PGBIN/initdb" -D "$PGDATA" -U postgres --no-locale --encoding=UTF8 >/dev/null
  fi

  if "$PGBIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
    echo "Already running."
  else
    "$PGBIN/pg_ctl" -D "$PGDATA" -o "-p $PORT -k $SOCKET_DIR -c listen_addresses=''" -l "$DEVDB_DIR/postgres.log" start
  fi

  if ! "$PGBIN/psql" -h "$SOCKET_DIR" -p "$PORT" -U postgres -lqt | cut -d '|' -f 1 | grep -qw "$DB_NAME"; then
    echo "Creating database $DB_NAME ..."
    "$PGBIN/createdb" -h "$SOCKET_DIR" -p "$PORT" -U postgres "$DB_NAME"
  fi

  echo ""
  echo "Local Postgres is running (unix socket only, not reachable over TCP/network)."
  echo "Put this in your .env:"
  echo "  DATABASE_URL=postgresql://postgres@127.0.0.1:${PORT}/${DB_NAME}?host=${SOCKET_DIR}"
}

stop() {
  if [ -d "$PGDATA" ]; then
    "$PGBIN/pg_ctl" -D "$PGDATA" stop 2>/dev/null || echo "Not running."
  else
    echo "No local cluster found."
  fi
}

status() {
  if [ -d "$PGDATA" ]; then
    "$PGBIN/pg_ctl" -D "$PGDATA" status 2>&1 || true
  else
    echo "No local cluster found. Run: npm run db:start"
  fi
}

reset() {
  stop || true
  rm -rf "$DEVDB_DIR"
  echo "Removed $DEVDB_DIR. Run 'npm run db:start' to create a fresh cluster."
}

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  status) status ;;
  reset) reset ;;
  *)
    echo "Usage: $0 {start|stop|status|reset}" >&2
    exit 1
    ;;
esac
