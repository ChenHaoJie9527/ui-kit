import { Button, type ButtonProps } from "seam-react";
import { valibotResolver } from "seam-react/valibot";
import { useCounter } from "seam-hooks";
import * as v from "valibot";

// 以下 4 处都是预期类型错误：类型系统正常时它们必须报出。
// （issue #83 复现用例：nodenext 下声明无法解析时这些错误会全部消失，类型退化为 any。）
export const el = <Button variant="not-a-valid-variant" />;
export const badProps: ButtonProps = 123;
export const hookProbe: symbol = useCounter;
export const checkErrors = async () => {
  const errors = await valibotResolver(v.object({ email: v.string() }))({
    email: "a",
  });
  const errProbe: symbol = errors;
  return errProbe;
};
