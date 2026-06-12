export type SignUpFormInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ValidSignUpForm = {
  firstName: string;
  lastName: string;
  fullName: string;
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
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();

  if (!firstName) {
    return { ok: false, message: "Enter your first name." };
  }

  if (!lastName) {
    return { ok: false, message: "Enter your last name." };
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
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      password: input.password,
    },
  };
}
