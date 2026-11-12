import { FormActions } from "./FormActions";
import { FormControl } from "./FormControl";
import { FormDescription } from "./FormDescription";
import { FormErrorMessage } from "./FormErrorMessage";
import { FormField } from "./FormField";
import { FormLabel } from "./FormLabel";
import { FormRoot } from "./FormRoot";

export interface FormComponent {
  Root: typeof FormRoot;
  Field: typeof FormField;
  Label: typeof FormLabel;
  Control: typeof FormControl;
  Description: typeof FormDescription;
  ErrorMessage: typeof FormErrorMessage;
  Actions: typeof FormActions;
}

export const Form: FormComponent = {
  Root: FormRoot,
  Field: FormField,
  Label: FormLabel,
  Control: FormControl,
  Description: FormDescription,
  ErrorMessage: FormErrorMessage,
  Actions: FormActions,
};
