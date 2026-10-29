import type { AuthError } from "@supabase/supabase-js";

/** Turns Supabase Auth errors into sentences a member can act on. */
export function authErrorMessage(error: Pick<AuthError, "code" | "status" | "message">): string {
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don't match. Try again, or reset your password.";
    case "email_not_confirmed":
      return "Please confirm your email first. We sent you a link when you signed up.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Sign in instead.";
    case "weak_password":
      return "Choose a stronger password: at least 8 characters, with upper and lowercase letters and a number.";
    case "same_password":
      return "Your new password must be different from the old one.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
    case "session_not_found":
    case "refresh_token_not_found":
      return "Your session has ended. Please sign in again.";
  }
  if (error.status === 429) return "Too many attempts. Please wait a minute and try again.";
  return "We couldn't complete that just now. Please try again.";
}
