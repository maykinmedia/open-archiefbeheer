import { SubmitOptions, useSubmit } from "react-router-dom";

// From React Router
type JsonObject = {
  [Key in string]: JsonValue;
} & {
  [Key in string]?: JsonValue | undefined;
};
type JsonArray = JsonValue[] | readonly JsonValue[];
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Can be used when using (React Router) actions to explicitly set the type
 * of action, and it's payload. This is similar to a Redux action.
 *
 * @example
 *
 *   const increment: TypedAction = {
 *     type: "INCREMENT_VALUE",
 *     payload: 1
 *   }
 *
 * NOTE: Using complex objects in (React Router) `submit()` calls require a method
 * to be set and an encType of "application/json" to be used.
 *
 * @example
 *   const submit = useSubmit()
 *
 *   submit(increment, {
 *       method: "POST",  // NOTE: Not needed when using `submitAction()`.
 *       encType: "application/json",  // NOTE: Not needed when using `submitAction()`.
 *   })
 */
export type TypedAction<T = string, P = JsonValue> = {
  type: T;
  payload: P;
};

/**
 * A small wrapper around React Routers' `useSubmit()` that takes a `TypedAction`
 * as data. The `SubmitOptions` default to method of "POST" and an encType of "application/json".
 *
 * @example
 *   const submitAction = useSubmitAction();
 *
 *   const increment: TypedAction = {
 *     type: "INCREMENT_VALUE",
 *     payload: 1
 *   }
 *
 *   submitAction(increment);
 *
 * NOTE: In the (React Router) action handler `request.clone().json()` should be
 * used to retrieve the `TypedAction`. If multiple actions should be handled the
 * type of the action can be used to determine the applicable logic.
 */
export function useSubmitAction() {
  const submit = useSubmit();

  return (typedAction: TypedAction, options: SubmitOptions = {}) => {
    const targetOptions: SubmitOptions = {
      method: "POST",
      encType: "application/json",
    };
    Object.assign(targetOptions, options);
    return submit(typedAction, targetOptions);
  };
}
