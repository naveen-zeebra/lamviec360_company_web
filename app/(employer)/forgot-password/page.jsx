import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata = {
  title: "Forgot Password | Employer Portal - LàmViệc360",
  description: "Reset your company employer account password.",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
