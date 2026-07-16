import LoginClient from "@/components/client/LoginClient";

export const metadata = {
  title: "Login",
  description: "Sign in to your account",
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <LoginClient />
    </div>
  );
}
