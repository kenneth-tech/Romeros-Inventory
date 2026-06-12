# Sign Up Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a create-account flow to Romeros Inventory so a new user can register with name, email, and password, then access the dashboard after Supabase authentication succeeds.

**Architecture:** Keep the signup page in the existing auth route group and follow the current login page pattern with a Client Component and the existing browser Supabase client. Put form validation in a small shared module so it can be tested directly, use Supabase Auth `signUp`, and rely on the existing `handle_new_user` database trigger to create a `profiles` row with role `staff`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Auth via `@supabase/ssr`, Tailwind CSS utilities, Vitest for focused validation tests.

---

## Current Context

- Existing login page: `app/(auth)/login/page.tsx`
- Existing browser Supabase client: `lib/supabase.ts`
- Existing server Supabase client: `lib/supabase-server.ts`
- Existing auth guard: `proxy.ts` and `app/(dashboard)/layout.tsx`
- Existing profile trigger: `supabase/migration.sql` creates `public.profiles` with default role `staff` on `auth.users` insert.
- Supabase docs checked: `supabase.auth.signUp({ email, password, options })` returns a session immediately only when email confirmation is disabled; otherwise it returns a user and `session` is null.

## File Structure

- Modify `package.json`
  - Add a `test` script for Vitest.
  - Add `vitest` as a dev dependency during implementation.
- Create `lib/auth-validation.ts`
  - Owns signup form validation and password rules.
  - Exports `validateSignUpForm` and related types.
- Create `lib/auth-validation.test.ts`
  - Tests validation without rendering the app or touching Supabase.
- Create `app/(auth)/signup/page.tsx`
  - Renders create-account form.
  - Calls Supabase `auth.signUp`.
  - Sends `full_name` as display metadata only.
  - Redirects to `/dashboard` if Supabase creates a session immediately.
  - Redirects to `/signup/success?email=...` if email confirmation is required.
- Create `app/(auth)/signup/success/page.tsx`
  - Shows confirmation instructions after signup when email confirmation is enabled.
- Modify `app/(auth)/login/page.tsx`
  - Add a link to `/signup`.
  - Keep the current sign-in behavior.
- Modify `proxy.ts`
  - Redirect an already-authenticated user away from `/signup` and `/signup/success` to `/dashboard`.

---

### Task 1: Add Focused Validation Tests

**Files:**
- Modify: `package.json`
- Create: `lib/auth-validation.test.ts`

- [ ] **Step 1: Install Vitest**

Run:

```bash
npm install -D vitest
```

Expected: `package.json` includes `vitest` in `devDependencies`, and `package-lock.json` is updated.

- [ ] **Step 2: Add the test script**

In `package.json`, update `scripts` to:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run"
}
```

- [ ] **Step 3: Create failing validation tests**

Create `lib/auth-validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateSignUpForm } from "./auth-validation";

describe("validateSignUpForm", () => {
  it("accepts a complete signup form", () => {
    const result = validateSignUpForm({
      name: "Maria Romero",
      email: "maria@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        name: "Maria Romero",
        email: "maria@example.com",
        password: "secret123",
      },
    });
  });

  it("trims name and email before returning values", () => {
    const result = validateSignUpForm({
      name: "  Juan Dela Cruz  ",
      email: "  Juan@Example.COM  ",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        name: "Juan Dela Cruz",
        email: "juan@example.com",
        password: "secret123",
      },
    });
  });

  it("rejects a blank name", () => {
    const result = validateSignUpForm({
      name: " ",
      email: "maria@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result).toEqual({
      ok: false,
      message: "Enter your full name.",
    });
  });

  it("rejects an invalid email", () => {
    const result = validateSignUpForm({
      name: "Maria Romero",
      email: "maria",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result).toEqual({
      ok: false,
      message: "Enter a valid email address.",
    });
  });

  it("rejects a short password", () => {
    const result = validateSignUpForm({
      name: "Maria Romero",
      email: "maria@example.com",
      password: "short",
      confirmPassword: "short",
    });

    expect(result).toEqual({
      ok: false,
      message: "Password must be at least 8 characters.",
    });
  });

  it("rejects mismatched passwords", () => {
    const result = validateSignUpForm({
      name: "Maria Romero",
      email: "maria@example.com",
      password: "secret123",
      confirmPassword: "secret124",
    });

    expect(result).toEqual({
      ok: false,
      message: "Passwords do not match.",
    });
  });
});
```

- [ ] **Step 4: Run the validation tests and confirm they fail**

Run:

```bash
npm test -- lib/auth-validation.test.ts
```

Expected: FAIL because `lib/auth-validation.ts` does not exist yet.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json lib/auth-validation.test.ts
git commit -m "test: add signup validation coverage"
```

---

### Task 2: Implement Signup Validation

**Files:**
- Create: `lib/auth-validation.ts`
- Test: `lib/auth-validation.test.ts`

- [ ] **Step 1: Create validation module**

Create `lib/auth-validation.ts`:

```ts
export type SignUpFormInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ValidSignUpForm = {
  name: string;
  email: string;
  password: string;
};

export type SignUpValidationResult =
  | { ok: true; value: ValidSignUpForm }
  | { ok: false; message: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignUpForm(
  input: SignUpFormInput
): SignUpValidationResult {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) {
    return { ok: false, message: "Enter your full name." };
  }

  if (!emailPattern.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (input.password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  if (input.password !== input.confirmPassword) {
    return { ok: false, message: "Passwords do not match." };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      password: input.password,
    },
  };
}
```

- [ ] **Step 2: Run the validation tests and confirm they pass**

Run:

```bash
npm test -- lib/auth-validation.test.ts
```

Expected: PASS for all six validation tests.

- [ ] **Step 3: Commit**

```bash
git add lib/auth-validation.ts lib/auth-validation.test.ts
git commit -m "feat: add signup validation"
```

---

### Task 3: Add Signup Page

**Files:**
- Create: `app/(auth)/signup/page.tsx`
- Uses: `lib/auth-validation.ts`
- Uses: `lib/supabase.ts`

- [ ] **Step 1: Create the signup page**

Create `app/(auth)/signup/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, Lock, Mail, UserPlus } from "lucide-react";
import { validateSignUpForm } from "@/lib/auth-validation";
import { createClient } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validation = validateSignUpForm({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: validation.value.email,
      password: validation.value.password,
      options: {
        data: {
          full_name: validation.value.name,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (authError) {
      setError(authError.message || "Account could not be created.");
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    router.push(
      `/signup/success?email=${encodeURIComponent(validation.value.email)}`
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Join Romeros Inventory
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Maria Romero"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Repeat password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmed password"
                      : "Show confirmed password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Romeros Car Aircon &mdash; Internal System
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS. If formatting triggers a line-length warning, split the long JSX line containing the `Link` class name into multiple lines.

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/signup/page.tsx
git commit -m "feat: add signup page"
```

---

### Task 4: Add Signup Success Page

**Files:**
- Create: `app/(auth)/signup/success/page.tsx`

- [ ] **Step 1: Create the success page**

Create `app/(auth)/signup/success/page.tsx`:

```tsx
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";

export default async function SignUpSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Check your email
          </h1>
          <div className="flex justify-center mt-4">
            <Mail className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {email
              ? `We sent a confirmation link to ${email}.`
              : "We sent a confirmation link to your email address."}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Confirm your account, then sign in to continue.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex w-full justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint and build**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands PASS. If the `searchParams` type fails under Next.js 16, keep the `Promise<{ email?: string }>` signature because this project includes `.next/dev/types` in `tsconfig.json`.

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/signup/success/page.tsx
git commit -m "feat: add signup confirmation page"
```

---

### Task 5: Link Login and Signup, Then Update Auth Redirects

**Files:**
- Modify: `app/(auth)/login/page.tsx`
- Modify: `proxy.ts`

- [ ] **Step 1: Add `Link` import to login page**

At the top of `app/(auth)/login/page.tsx`, add:

```tsx
import Link from "next/link";
```

Keep the existing imports:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
```

- [ ] **Step 2: Add create-account link below the login form**

Inside the white card in `app/(auth)/login/page.tsx`, immediately after `</form>`, add:

```tsx
<p className="text-center text-sm text-gray-500 mt-5">
  Need an account?{" "}
  <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
    Create one
  </Link>
</p>
```

If lint reports the JSX line is too long, split the `Link` attributes across lines.

- [ ] **Step 3: Update proxy redirect logic**

In `proxy.ts`, replace:

```ts
  // Authenticated user visiting login → redirect to dashboard
  if (user && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }
```

with:

```ts
  // Authenticated user visiting auth pages -> redirect to dashboard
  if (
    user &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/signup/success")
  ) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }
```

- [ ] **Step 4: Run lint and tests**

Run:

```bash
npm run lint
npm test
```

Expected: both commands PASS.

- [ ] **Step 5: Commit**

```bash
git add app/(auth)/login/page.tsx proxy.ts
git commit -m "feat: connect signup flow to auth routes"
```

---

### Task 6: Verify Supabase Signup Behavior

**Files:**
- Uses: `supabase/migration.sql`
- Uses: `app/(auth)/signup/page.tsx`
- Uses: Supabase dashboard Authentication settings

- [ ] **Step 1: Confirm Supabase Auth settings**

In the Supabase dashboard, confirm these settings:

- Email provider is enabled.
- Site URL points to the deployed app URL or `http://localhost:3000` during local testing.
- Redirect URLs include `http://localhost:3000/dashboard` for local testing and the production `/dashboard` URL for deployed testing.
- Confirm email setting is intentionally either enabled or disabled.

Expected:

- If Confirm email is enabled, signup goes to `/signup/success`.
- If Confirm email is disabled, signup creates a session and goes to `/dashboard`.

- [ ] **Step 2: Confirm the profile trigger exists**

Run this in Supabase SQL Editor:

```sql
select
  tgname
from pg_trigger
where tgname = 'trg_on_auth_user_created';
```

Expected result:

```text
trg_on_auth_user_created
```

- [ ] **Step 3: Create a test account through the UI**

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/signup
```

Submit:

```text
Full name: Test Staff
Email: signup-test@example.com
Password: secret123
Confirm password: secret123
```

Expected:

- The form submits without a validation error.
- The app redirects to `/signup/success` when email confirmation is enabled.
- The app redirects to `/dashboard` when email confirmation is disabled.

- [ ] **Step 4: Confirm the profile row**

Run this in Supabase SQL Editor after signup:

```sql
select
  p.id,
  p.role,
  p.name,
  u.email
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'signup-test@example.com';
```

Expected shape:

```text
role: staff
name: Test Staff
email: signup-test@example.com
```

- [ ] **Step 5: Run final checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/auth-validation.ts lib/auth-validation.test.ts app/(auth)/signup app/(auth)/login/page.tsx proxy.ts
git commit -m "feat: support account signup"
```

---

## Security Notes

- Do not store role, branch access, or admin permissions in `raw_user_meta_data`. Supabase user metadata is user-editable and must not be used for authorization.
- This plan sends only `full_name` in signup metadata. The database trigger copies it into `public.profiles.name`.
- New accounts default to `staff`. In the current schema, authenticated staff users can read and write core inventory tables. For a private internal system, consider a later plan for admin invites, invite codes, or approval before users can access inventory data.
- The existing migration uses `security definer` functions in the exposed `public` schema. Supabase recommends keeping privileged database functions in a private/unexposed schema; that should be handled in a separate schema-hardening plan to avoid mixing signup UI with RLS refactoring.

## Self-Review

- Spec coverage: The requested create-account/signup flow is covered by validation, UI, Supabase signup, profile creation verification, login link, and route protection.
- Placeholder scan: Every task names concrete files, commands, expected outcomes, and code.
- Type consistency: `validateSignUpForm`, `SignUpFormInput`, `ValidSignUpForm`, and route paths are consistent across tasks.

## Sources Checked

- Supabase JavaScript `signUp` reference: https://supabase.com/docs/reference/javascript/auth-signup
- Supabase JavaScript Auth overview: https://supabase.com/docs/reference/javascript/auth-api
- Local Next.js 16 docs in `node_modules/next/dist/docs/`, including Client Components, `useRouter`, Proxy, and App Router `searchParams` references.
