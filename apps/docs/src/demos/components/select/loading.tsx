import { useState } from "react";
import { Button, Select } from "seam-react";
import { useAsync } from "seam-hooks";

const remoteRegions = [
  { value: "cn-east", label: "华东" },
  { value: "cn-north", label: "华北" },
  { value: "cn-south", label: "华南" },
];

async function loadRegions(requestId: number) {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return remoteRegions.map((region) => ({
    ...region,
    label: `${region.label} · v${requestId + 1}`,
  }));
}

export function Demo() {
  const [requestId, setRequestId] = useState(0);
  const { value, loading } = useAsync(
    () => loadRegions(requestId),
    [requestId],
    {
      initialValue: remoteRegions,
    },
  );

  return (
    <div className="flex max-w-[420px] flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          loading={loading}
          onClick={() => setRequestId((id) => id + 1)}
        >
          重新加载
        </Button>
        <span className="text-[12.5px] text-muted">点击后立即打开 Select</span>
      </div>
      <Select
        options={value ?? []}
        loading={loading}
        loadingText="加载区域中..."
        aria-label="部署区域"
      />
      <p className="m-0 text-[12.5px] text-muted">
        请求期间 Select 触发器显示 loading，并暂时不可交互。
      </p>
    </div>
  );
}
