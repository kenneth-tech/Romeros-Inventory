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
