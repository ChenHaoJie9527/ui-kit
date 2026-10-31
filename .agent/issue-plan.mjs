const TITLE_PATTERN =
  /^(feat|fix|enhance|enhancement|refactor|chore|docs)(?:\(([^)]*)\))?\s*[:：]\s*(.*)$/i;

function cleanName(value) {
  return value
    .replace(/^(?:add|improve|create|add new)\s+/i, "")
    .replace(/^(?:添加|新增|创建|修复)\s*/g, "")
    .replace(/^组件\s*/g, "")
    .trim();
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function parseIssuePlan(title, issueNumber) {
  const normalizedTitle = title.trim();
  if (normalizedTitle === "") {
    throw new Error("Issue title cannot be empty.");
  }

  const match = normalizedTitle.match(TITLE_PATTERN);
  const prefix = match?.[1]?.toLowerCase() ?? "";
  const scope = match?.[2]?.trim() ?? "";
  const remainder = match?.[3]?.trim() ?? normalizedTitle;
  const isBug = prefix === "fix" || normalizedTitle.startsWith("修复");
  const isEnhancement = prefix === "enhance" || prefix === "enhancement";

  if (isEnhancement) {
    if (scope === "" || scope.toLowerCase() === "ui") {
      throw new Error(
        "Enhancement titles must name the target component, for example: enhance(Form): ...",
      );
    }
    if (remainder === "") {
      throw new Error("Enhancement titles must describe the requested change.");
    }

    const componentSlug = slugify(scope);
    if (componentSlug === "") {
      throw new Error("Enhancement target must contain letters or numbers.");
    }

    return {
      component: scope,
      slug: componentSlug,
      type: "enhancement",
      runId: `${componentSlug}-enhancement-issue-${issueNumber}`,
      branch: `codex/${componentSlug}-enhancement-${issueNumber}`,
      requiresSpec: true,
    };
  }

  const component = cleanName(remainder);
  if (component === "") {
    throw new Error("Issue title must name the target component.");
  }

  const slug = slugify(component) || "component";
  return {
    component,
    slug,
    type: isBug ? "bugfix" : "new-component",
    runId: `${slug}-issue-${issueNumber}`,
    branch: `codex/${slug}`,
    requiresSpec: !isBug,
  };
}
