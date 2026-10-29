/**
 * What every Server Action returns. Actions never throw for expected failures (bad input, a
 * rejected sign-in); they return `ok: false` with a message the UI can show as is.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string, fieldErrors?: Record<string, string[] | undefined>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** The message shown when something unexpected happens. Details go to the server log, not the UI. */
export const UNEXPECTED_ERROR = "Something went wrong on our side. Please try again in a moment.";

/** Field errors keyed by their dotted path ("about.birthTime"), matching react-hook-form names. */
export function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** The standard failure for input that did not pass validation. */
export function invalid(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return fail("Check the highlighted fields.", fieldErrors(error));
}
