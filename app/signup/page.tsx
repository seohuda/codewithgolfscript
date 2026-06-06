import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "회원가입 | CODE WITH GOLFSCRIPT",
};

export default function SignupPage() {
  return (
    <div className="py-8">
      <AuthForm mode="signup" />
    </div>
  );
}
