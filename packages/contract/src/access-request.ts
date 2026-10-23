/** Landing-page access request (POST /api/access-requests). */
import * as v from "valibot";

export const accessRequestSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  company: v.optional(v.pipe(v.string(), v.maxLength(120))),
  message: v.optional(v.pipe(v.string(), v.maxLength(2000))),
});
export type AccessRequest = v.InferInput<typeof accessRequestSchema>;
