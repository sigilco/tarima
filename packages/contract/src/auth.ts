/** Auth: email OTP request/verify (Stage 3 auth-core). */
import * as v from "valibot";

export const requestOtpSchema = v.object({
  email: v.pipe(v.string(), v.email()),
});
export type RequestOtp = v.InferInput<typeof requestOtpSchema>;

export const requestOtpResponseSchema = v.object({
  ok: v.literal(true),
  /** Cooldown before resend is allowed, seconds. */
  resendAfterSec: v.pipe(v.number(), v.integer(), v.minValue(1)),
});
export type RequestOtpResponse = v.InferOutput<typeof requestOtpResponseSchema>;

export const verifyOtpSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  /** 6-digit code. */
  code: v.pipe(v.string(), v.regex(/^\d{6}$/)),
});
export type VerifyOtp = v.InferInput<typeof verifyOtpSchema>;

export const verifyOtpResponseSchema = v.object({
  ok: v.literal(true),
  userId: v.pipe(v.string(), v.uuid()),
});
export type VerifyOtpResponse = v.InferOutput<typeof verifyOtpResponseSchema>;
