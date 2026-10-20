# Login — /login?step=code&email=…

Step 1 (?step=email):  [ your@email.com ]  [Send code]
Step 2 (?step=code):   [ • • • • • • ]     [Verify]  Resend
Agents: curl POST /auth/request-otp → GET /internal/admin/inbox → verify-otp
