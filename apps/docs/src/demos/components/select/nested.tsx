import { useState } from "react";
import { Select } from "seam-react";

const regions = [
  {
    value: "east",
    label: "华东",
    children: [
      { value: "shanghai-v3", label: "上海 V3" },
      { value: "hangzhou-v3", label: "杭州 V3" },
    ],
  },
  {
    value: "south",
    label: "华南",
    children: [
      { value: "guangzhou-v3", label: "广州 V3" },
      { value: "shenzhen-v3", label: "深圳 V3" },
    ],
  },
];

export function Demo() {
  const [region, setRegion] = useState("shanghai-v3");

  return (
    <div className="flex max-w-[360px] flex-col gap-3">
      <Select
        options={regions}
        value={region}
        onValueChange={setRegion}
        aria-label="部署区域"
      />
      <p className="m-0 text-[12.5px] text-muted">当前区域：{region}</p>
    </div>
  );
}
