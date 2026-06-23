import AuthForm from "@/components/AuthForm";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: `로그인 | ${SITE_NAME}`,
};

export default function LoginPage() {
  return (
    <div className="py-8">
      <AuthForm mode="login" />
    </div>
  );
}
