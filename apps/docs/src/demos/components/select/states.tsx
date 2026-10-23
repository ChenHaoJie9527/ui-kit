import { Select } from "seam-react";

const regions = [
  { value: "cn-north", label: "华北" },
  { value: "cn-east", label: "华东" },
  { value: "global", label: "全球" },
];

export function Demo() {
  return (
    <div className="flex max-w-[360px] flex-col gap-4">
      <Select
        options={regions}
        defaultValue="cn-east"
        size="lg"
        aria-label="区域"
      />
      <Select options={regions} invalid aria-label="无效区域" />
      <Select
        options={regions}
        disabled
        defaultValue="global"
        aria-label="禁用区域"
      />
      <Select options={[]} aria-label="空区域" emptyText="暂可用区域尚未开放" />
    </div>
  );
}
