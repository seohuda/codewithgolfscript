import AuthForm from "@/components/AuthForm";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: `회원가입 | ${SITE_NAME}`,
};

export default function SignupPage() {
  return (
    <div className="py-8">
      <AuthForm mode="signup" />
    </div>
  );
}
