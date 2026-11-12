import { markControl } from "../control-contract";
import { RadioGroupItem } from "./RadioGroupItem";
import { RadioGroupRoot } from "./RadioGroupRoot";

export const RadioGroup = markControl(
  Object.assign(RadioGroupRoot, {
    Item: RadioGroupItem,
  }),
  "value",
);
export { RadioGroupItem };
export type RadioGroupComponent = typeof RadioGroup;
