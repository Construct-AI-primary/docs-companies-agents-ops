#!/bin/bash
# ============================================================
# TEST SUITE — OpenClaw Bot Commands
# ============================================================
# This script tests all bot commands by sending them to Discord
# via webhook or direct channel messages, then verifying responses.
#
# Usage:
#   ./test-bot-commands.sh [--dry-run] [--channel bot-commands]
#
# Prerequisites:
#   - DISCORD_BOT_TOKEN in environment or .env
#   - curl, jq installed
# ============================================================

set -euo pipefail

# ── Configuration ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_DIR}/.env"

# Load .env if exists
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

DISCORD_BOT_TOKEN="${DISCORD_BOT_TOKEN:-}"
TEST_CHANNEL="${TEST_CHANNEL:-bot-commands}"
TEST_SERVER="${TEST_SERVER:-ALL-DISCIPLINES}"
DRY_RUN=false
VERBOSE=false

# Parse args
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --verbose) VERBOSE=true ;;
    --channel=*) TEST_CHANNEL="${arg#*=}" ;;
    --server=*) TEST_SERVER="${arg#*=}" ;;
    --help)
      echo "Usage: $0 [--dry-run] [--verbose] [--channel=name] [--server=name]"
      echo ""
      echo "Tests all bot commands by sending them to Discord and verifying responses."
      echo ""
      echo "Options:"
      echo "  --dry-run        Print commands without sending"
      echo "  --verbose        Show full response details"
      echo "  --channel=name   Target channel (default: bot-commands)"
      echo "  --server=name    Target server (default: ALL-DISCIPLINES)"
      exit 0
      ;;
  esac
done

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ── State ──
PASSED=0
FAILED=0
SKIPPED=0
TOTAL=0

# ── Helpers ──
log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_pass()  { echo -e "${GREEN}[PASS]${NC} $1"; ((PASSED++)); }
log_fail()  { echo -e "${RED}[FAIL]${NC} $1"; ((FAILED++)); }
log_skip()  { echo -e "${YELLOW}[SKIP]${NC} $1"; ((SKIPPED++)); }
log_test()  { ((TOTAL++)); echo -e "\n${YELLOW}[TEST $TOTAL]${NC} $1"; }

# ── Check prerequisites ──
if [ -z "$DISCORD_BOT_TOKEN" ]; then
  echo -e "${RED}ERROR: DISCORD_BOT_TOKEN not set. Set it in .env or environment.${NC}"
  exit 1
fi

if ! command -v curl &>/dev/null; then
  echo -e "${RED}ERROR: curl is required but not installed.${NC}"
  exit 1
fi

# ── Get guild and channel IDs ──
log_info "Resolving server and channel IDs..."

# Get guilds
GUILDS_JSON=$(curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  "https://discord.com/api/v10/users/@me/guilds" 2>/dev/null)

GUILD_ID=$(echo "$GUILDS_JSON" | jq -r ".[] | select(.name == \"$TEST_SERVER\") | .id" 2>/dev/null)

if [ -z "$GUILD_ID" ] || [ "$GUILD_ID" = "null" ]; then
  log_fail "Could not find server '$TEST_SERVER'. Available servers:"
  echo "$GUILDS_JSON" | jq -r '.[].name' 2>/dev/null || echo "  (none found)"
  exit 1
fi
log_info "Server: $TEST_SERVER (ID: $GUILD_ID)"

# Get channels
CHANNELS_JSON=$(curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  "https://discord.com/api/v10/guilds/$GUILD_ID/channels" 2>/dev/null)

CHANNEL_ID=$(echo "$CHANNELS_JSON" | jq -r ".[] | select(.name == \"$TEST_CHANNEL\") | .id" 2>/dev/null)

if [ -z "$CHANNEL_ID" ] || [ "$CHANNEL_ID" = "null" ]; then
  log_fail "Could not find channel '#$TEST_CHANNEL' in $TEST_SERVER."
  exit 1
fi
log_info "Channel: #$TEST_CHANNEL (ID: $CHANNEL_ID)"

# ── Send message to Discord ──
send_message() {
  local content="$1"
  local expected_pattern="${2:-}"
  
  if [ "$DRY_RUN" = true ]; then
    echo "    Would send: $content"
    return 0
  fi
  
  # Send message
  local response
  response=$(curl -s -X POST \
    -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"content\": $(echo "$content" | jq -Rs .)}" \
    "https://discord.com/api/v10/channels/$CHANNEL_ID/messages" 2>/dev/null)
  
  local message_id
  message_id=$(echo "$response" | jq -r '.id' 2>/dev/null)
  
  if [ -z "$message_id" ] || [ "$message_id" = "null" ]; then
    echo "    ERROR sending message: $(echo "$response" | jq -r '.message // "unknown error"' 2>/dev/null)"
    return 1
  fi
  
  echo "    Sent (ID: $message_id)"
  
  # Wait for bot response
  sleep 3
  
  # Get recent messages to find bot's reply
  local replies
  replies=$(curl -s \
    -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
    "https://discord.com/api/v10/channels/$CHANNEL_ID/messages?limit=5" 2>/dev/null)
  
  local bot_reply
  bot_reply=$(echo "$replies" | jq -r "[.[] | select(.author.bot == true and .referenced_message?.id == \"$message_id\")] | first | .content" 2>/dev/null)
  
  if [ -z "$bot_reply" ] || [ "$bot_reply" = "null" ]; then
    # Try without reference (some bots reply without referencing)
    bot_reply=$(echo "$replies" | jq -r "[.[] | select(.author.bot == true)] | first | .content" 2>/dev/null)
  fi
  
  if [ -z "$bot_reply" ] || [ "$bot_reply" = "null" ]; then
    echo "    No bot response detected"
    return 2
  fi
  
  if [ "$VERBOSE" = true ]; then
    echo "    Response: ${bot_reply:0:200}..."
  fi
  
  # Check expected pattern
  if [ -n "$expected_pattern" ]; then
    if echo "$bot_reply" | grep -qi "$expected_pattern"; then
      return 0
    else
      echo "    Pattern not matched: '$expected_pattern'"
      echo "    Got: ${bot_reply:0:100}"
      return 1
    fi
  fi
  
  return 0
}

# ── Test: !ping ──
log_test "!ping — Health check"
if send_message "!ping" "Pong"; then
  log_pass "!ping responded"
else
  log_fail "!ping failed"
fi

# ── Test: !help ──
log_test "!help — Command reference"
if send_message "!help" "OpenClaw Bot"; then
  log_pass "!help responded"
else
  log_fail "!help failed"
fi

# ── Test: !status ──
log_test "!status — Server status"
if send_message "!status" "OpenClaw Bot Status"; then
  log_pass "!status responded"
else
  log_fail "!status failed"
fi

# ── Test: !whoami ──
log_test "!whoami — Channel identity"
if send_message "!whoami" "channel"; then
  log_pass "!whoami responded"
else
  log_fail "!whoami failed"
fi

# ── Test: !taxonomy ──
log_test "!taxonomy — Channel breakdown"
if send_message "!taxonomy" "Channel Taxonomy"; then
  log_pass "!taxonomy responded"
else
  log_fail "!taxonomy failed"
fi

# ── Test: !channels ──
log_test "!channels — Agent channel list"
if send_message "!channels" "Agent Channels"; then
  log_pass "!channels responded"
else
  log_fail "!channels failed"
fi

# ── Test: !works (no active) ──
log_test "!works — No active sessions"
if send_message "!works" "No active"; then
  log_pass "!works (empty) responded"
else
  log_fail "!works (empty) failed"
fi

# ── Test: !whois ──
log_test "!whois PROD-001 — Issue lookup"
if send_message "!whois PROD-001" "PROD-001"; then
  log_pass "!whois PROD-001 responded"
else
  log_fail "!whois PROD-001 failed"
fi

# ── Test: !whois (no arg) ──
log_test "!whois — Usage message"
if send_message "!whois" "Usage"; then
  log_pass "!whois (no arg) showed usage"
else
  log_fail "!whois (no arg) failed"
fi

# ── Test: !gate ──
log_test "!gate PROD-TEST — Gate status"
if send_message "!gate PROD-TEST" "Gate Status"; then
  log_pass "!gate PROD-TEST responded"
else
  log_fail "!gate PROD-TEST failed"
fi

# ── Test: !recent ──
log_test "!recent — Completed work"
if send_message "!recent" "Completed"; then
  log_pass "!recent responded"
else
  log_fail "!recent failed"
fi

# ── Test: !next ──
log_test "!next — Next batch"
if send_message "!next" "Next Batch"; then
  log_pass "!next responded"
else
  log_fail "!next failed"
fi

# ── Test: !progress (no arg) ──
log_test "!progress — Usage message"
if send_message "!progress" "Usage"; then
  log_pass "!progress (no arg) showed usage"
else
  log_fail "!progress (no arg) failed"
fi

# ── Test: !search ──
log_test "!search procurement — Knowledge search"
if send_message "!search procurement" "procurement"; then
  log_pass "!search responded"
else
  log_fail "!search failed"
fi

# ── Test: !log ──
log_test "!log — Bot logs"
if send_message "!log" "log"; then
  log_pass "!log responded"
else
  log_fail "!log failed"
fi

# ── Test: !echo (no args) ──
log_test "!echo — Usage message"
if send_message "!echo" "Usage"; then
  log_pass "!echo (no args) showed usage"
else
  log_fail "!echo (no args) failed"
fi

# ── Test: !purge ──
log_test "!purge — Cleanup"
if send_message "!purge" "Purged"; then
  log_pass "!purge responded"
else
  log_fail "!purge failed"
fi

# ── Test: !cancel (no active) ──
log_test "!cancel PROD-999 — No active session"
if send_message "!cancel PROD-999" "No active"; then
  log_pass "!cancel (no active) responded"
else
  log_fail "!cancel (no active) failed"
fi

# ── Test: !deploy ──
log_test "!deploy — Deploy command"
if send_message "!deploy" "Deploy"; then
  log_pass "!deploy responded"
else
  log_fail "!deploy failed"
fi

# ── Test: !backup ──
log_test "!backup — Backup command"
if send_message "!backup" "Backup"; then
  log_pass "!backup responded"
else
  log_fail "!backup failed"
fi

# ── Test: Unknown command ──
log_test "!unknown — Unknown command handling"
if send_message "!unknown" "Unknown command"; then
  log_pass "!unknown showed error"
else
  log_fail "!unknown failed"
fi

# ── Test: @agent work (no issue) ──
log_test "@agent work on — Usage message"
if send_message "@agent work on" "Usage"; then
  log_pass "@agent work on (no issue) showed usage"
else
  log_fail "@agent work on (no issue) failed"
fi

# ── Test: @agent plan (no issue) ──
log_test "@agent plan — Usage message"
if send_message "@agent plan" "Usage"; then
  log_pass "@agent plan (no issue) showed usage"
else
  log_fail "@agent plan (no issue) failed"
fi

# ── Test: @agent status ──
log_test "@agent status — Status via mention"
if send_message "@agent status" "Status"; then
  log_pass "@agent status responded"
else
  log_fail "@agent status failed"
fi

# ── Summary ──
echo ""
echo "=========================================="
echo -e "  ${BLUE}TEST RESULTS${NC}"
echo "=========================================="
echo -e "  Total:  $TOTAL"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo -e "  ${YELLOW}Skipped: $SKIPPED${NC}"
echo "=========================================="

if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
fi