import { useState } from "react";
import { Select } from "seam-react";

const environments = [
  { value: "development", label: "Development" },
  { value: "preview", label: "Preview" },
  { value: "production", label: "Production" },
  { value: "legacy", label: "Legacy（禁用）", disabled: true },
];

export function Demo() {
  const [environment, setEnvironment] = useState("preview");

  return (
    <div className="flex max-w-[360px] flex-col gap-3">
      <Select
        options={environments}
        value={environment}
        onValueChange={setEnvironment}
        aria-label="部署环境"
      />
      <p className="m-0 text-[12.5px] text-muted">当前环境：{environment}</p>
    </div>
  );
}
