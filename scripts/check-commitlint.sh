#!/bin/sh
# 验证 subject-case 关闭后，以大写英文开头的标题也能通过。
set -u
cd "$(dirname "$0")/.." || exit 1

COMMITLINT=./node_modules/.bin/commitlint

pass=0
fail=0

check() {
  if printf '%s\n' "$1" | "$COMMITLINT" >/dev/null 2>&1; then
    echo "PASS  $1"
    pass=$((pass + 1))
  else
    echo "FAIL  $1"
    fail=$((fail + 1))
  fi
}

check "feat(docs): Hook 文档支持可编辑示例与代码高亮"
check "feat(docs): API 增加返回值表"
check "fix(ui): Dialog 焦点恢复失效"
check "docs: 为 hook 文档加入可编辑示例"

# 回归：这些规则必须仍然生效
if printf 'feat(docs):\n' | "$COMMITLINT" >/dev/null 2>&1; then
  echo "FAIL  空 subject 应当被拒绝"
  fail=$((fail + 1))
else
  echo "PASS  空 subject 仍被拒绝"
  pass=$((pass + 1))
fi

if printf 'nope(docs): 类型不在枚举里\n' | "$COMMITLINT" >/dev/null 2>&1; then
  echo "FAIL  非法 type 应当被拒绝"
  fail=$((fail + 1))
else
  echo "PASS  非法 type 仍被拒绝"
  pass=$((pass + 1))
fi

echo
echo "通过 $pass 项，失败 $fail 项"
[ "$fail" -eq 0 ]
