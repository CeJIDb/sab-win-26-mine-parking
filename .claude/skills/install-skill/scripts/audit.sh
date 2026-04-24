#!/usr/bin/env bash
# Security audit for a Claude skill directory.
# Usage: audit.sh <skill_dir>
# Exit: 0 = clean or warns only | 1 = hard-stop found | 2 = bad usage

set -u

SKILL_DIR="${1:-}"
if [ -z "$SKILL_DIR" ] || [ ! -d "$SKILL_DIR" ]; then
  echo "usage: $(basename "$0") <skill_dir>" >&2
  exit 2
fi

INCLUDES=(
  --include='*.md' --include='*.py' --include='*.sh' --include='*.bash'
  --include='*.zsh' --include='*.fish' --include='*.js' --include='*.mjs'
  --include='*.cjs' --include='*.ts' --include='*.tsx' --include='*.jsx'
  --include='*.json' --include='*.yaml' --include='*.yml' --include='*.toml'
  --include='*.ini' --include='*.cfg'
)

HARD=0
WARN=0

section() {
  echo ""
  echo "=== $1 ==="
}

check() {
  # check <level> <group> <label> <pattern>
  local level="$1" group="$2" label="$3" pattern="$4"
  local out
  out="$(grep -rnE "${INCLUDES[@]}" -e "$pattern" "$SKILL_DIR" 2>/dev/null || true)"
  if [ -n "$out" ]; then
    local n
    n=$(printf '%s\n' "$out" | wc -l)
    if [ "$level" = "HARD" ]; then
      HARD=$((HARD + n))
    else
      WARN=$((WARN + n))
    fi
    echo "  [$group] $label  ($n hit$([ "$n" -gt 1 ] && echo s))"
    printf '%s\n' "$out" | sed "s|^$SKILL_DIR/||" | sed 's/^/       /'
  fi
}

section "Hard-stop findings"

check HARD 1 "reads secrets" \
  '\.env($|[^.]|\.[^e])|~/\.ssh|/root/\.ssh|~/\.aws|credentials\.(json|txt|yaml|yml)|keyring\.|git[[:space:]]+config[[:space:]]+--get|\.netrc'

check HARD 3 "destructive" \
  'rm[[:space:]]+-rf|\bshred\b|\bdd[[:space:]]+.*of=/dev/|\bmkfs\b|>[[:space:]]*/dev/sd|git[[:space:]]+push[[:space:]]+(--force|-f)|git[[:space:]]+reset[[:space:]]+--hard|truncate[[:space:]]+-s[[:space:]]+0'

check HARD 4 "path escape" \
  '\.\./\.\.|/etc/|/usr/(bin|local|lib)|/var/(log|lib|spool)|/root/|~/\.bashrc|~/\.zshrc|~/\.profile|~/\.gitconfig|~/\.ssh/config|~/\.claude/settings\.json'

check HARD 5 "dynamic exec" \
  '\beval[[:space:]]*\(|\bexec[[:space:]]*\(|subprocess\..*shell[[:space:]]*=[[:space:]]*True|os\.system[[:space:]]*\(|new[[:space:]]+Function[[:space:]]*\(|Function[[:space:]]*\([^)]+\)[[:space:]]*\('

check HARD 6 "privilege" \
  '\bsudo\b|chmod[[:space:]]+\+x|curl.*\|[[:space:]]*(sh|bash|zsh)|wget.*\|[[:space:]]*(sh|bash|zsh)|\bchown\b|\bsetuid\b|\bsetgid\b'

check HARD 7 "obfuscation" \
  'base64[[:space:]]+-d|base64[[:space:]]+--decode|atob[[:space:]]*\(|eval[[:space:]]*\(atob'

section "Warnings"

check WARN 2 "outbound network" \
  '\bcurl[[:space:]]+|\bwget[[:space:]]+|\bhttpx\b|requests\.(get|post|put|delete|patch|head|request)|\bfetch[[:space:]]*\(|urllib\.request|urlopen|aiohttp\.'

check WARN 8 "runtime deps" \
  '\bpip[0-9]?[[:space:]]+install\b|\bnpm[[:space:]]+install\b|\bpnpm[[:space:]]+install\b|\byarn[[:space:]]+add\b|\bcargo[[:space:]]+install\b|\bgo[[:space:]]+install\b|\bbrew[[:space:]]+install\b|\bapt(-get)?[[:space:]]+install\b'

section "Binary files"

BIN_FOUND=0
BIN_LIST="$(mktemp)"
trap 'rm -f "$BIN_LIST"' EXIT

find "$SKILL_DIR" -type f \
  ! -name '*.md' ! -name '*.py' ! -name '*.sh' ! -name '*.bash' \
  ! -name '*.zsh' ! -name '*.fish' ! -name '*.js' ! -name '*.mjs' \
  ! -name '*.cjs' ! -name '*.ts' ! -name '*.tsx' ! -name '*.jsx' \
  ! -name '*.json' ! -name '*.yaml' ! -name '*.yml' ! -name '*.toml' \
  ! -name '*.ini' ! -name '*.cfg' ! -name '*.txt' ! -name 'LICENSE*' \
  ! -name 'README*' ! -path '*/.git/*' \
  -print0 2>/dev/null | while IFS= read -r -d '' f; do
    if ! file --mime-encoding "$f" 2>/dev/null | grep -qE 'us-ascii|utf-8|iso-8859|ascii'; then
      echo "  BINARY $f" >> "$BIN_LIST"
    fi
  done

if [ -s "$BIN_LIST" ]; then
  cat "$BIN_LIST"
  BIN_FOUND=$(wc -l < "$BIN_LIST")
  HARD=$((HARD + BIN_FOUND))
else
  echo "  (none)"
fi

section "Summary"
echo "hard_stop=$HARD"
echo "warnings=$WARN"
echo "binaries=$BIN_FOUND"

if [ "$HARD" -gt 0 ]; then
  exit 1
fi
exit 0
