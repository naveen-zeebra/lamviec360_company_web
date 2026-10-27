import { Suspense } from "react";
import ResetPasswordClient from "../reset-password/ResetPasswordClient";

export const metadata = {
  title: "Set New Password | Employer Portal - LàmViệc360",
  description: "Reset your company employer account password.",
};

export default function EmployerResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
