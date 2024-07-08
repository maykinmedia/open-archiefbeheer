/**
 * Should be used when using (React Router) actions to explicitly mark the type
 * of action and cary the payload.
 *
 * This is similar to Redux actions.
 *
 * @example
 *   submit({ type: "INCREMENT_VALUE", payload: 1 }, { method: "PATCH", encType: "application/json" });
 */
type StateMutationAction<T = string, P = unknown> = {
  type: T;
  payload: P;
};
