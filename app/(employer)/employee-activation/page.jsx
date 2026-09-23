import { Suspense } from "react";
import EmployeeActivationClient from "./EmployeeActivationClient";

export const metadata = {
  title: "Activate Your Account | LàmViệc360",
  description: "Set a password and join your company workspace.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EmployeeActivationClient />
    </Suspense>
  );
}
