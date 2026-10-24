import { useState } from "react";
import { Select } from "seam-react";

const capabilityOptions = [
  { value: "docs", label: "文档" },
  { value: "preview", label: "预览" },
  { value: "release", label: "发布" },
  { value: "legacy", label: "Legacy（禁用）", disabled: true },
];

export function Demo() {
  const [capabilities, setCapabilities] = useState<Array<string>>([
    "docs",
    "preview",
  ]);

  return (
    <div className="flex max-w-[420px] flex-col gap-3">
      <Select
        multiple
        clear
        options={capabilityOptions}
        value={capabilities}
        onValueChange={setCapabilities}
        aria-label="能力"
      />
      <p className="m-0 text-[12.5px] text-muted">
        已选择：{capabilities.length > 0 ? capabilities.join("、") : "—"}
      </p>
    </div>
  );
}
