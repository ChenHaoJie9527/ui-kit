import { getDotPath, safeParseAsync } from "valibot";
import type { GenericSchema, GenericSchemaAsync, InferInput } from "valibot";
import type { FormErrors } from "./FormComponent";

export type ValibotSchema = GenericSchema | GenericSchemaAsync;

type FormErrorsFor<TSchema extends ValibotSchema> =
  InferInput<TSchema> extends Record<string, unknown>
    ? FormErrors<InferInput<TSchema>>
    : FormErrors;

export type ValibotResolver<TSchema extends ValibotSchema> = (
  values: InferInput<TSchema>,
) => Promise<FormErrorsFor<TSchema>>;

/**
 * Adapts a Valibot schema to the existing Form.Root validate contract.
 *
 * The resolver validates only. It does not apply schema transformations to the
 * visible form values or the values passed to onSubmit.
 */
export function valibotResolver<const TSchema extends ValibotSchema>(
  schema: TSchema,
): ValibotResolver<TSchema> {
  if (schema === null || typeof schema !== "object") {
    throw new TypeError("valibotResolver expects a Valibot schema.");
  }

  return async (values) => {
    const result = await safeParseAsync(schema, values);

    if (result.success) return {};

    const errors: Record<string, string> = {};
    for (const issue of result.issues) {
      const path = getDotPath(issue) ?? "_form";
      if (errors[path] === undefined) {
        errors[path] = issue.message;
      }
    }

    return errors as FormErrorsFor<TSchema>;
  };
}
