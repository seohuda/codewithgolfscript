import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "로그인 | CODE WITH GOLFSCRIPT",
};

export default function LoginPage() {
  return (
    <div className="py-8">
      <AuthForm mode="login" />
    </div>
  );
}
