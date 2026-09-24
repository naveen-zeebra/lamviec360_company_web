import { Suspense } from "react";
import CompanyVerifyEmailClient from "./CompanyVerifyEmailClient";

export const metadata = {
  title: "Verify Company Email | LàmViệc360",
  description: "Confirm your company email address to continue.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CompanyVerifyEmailClient />
    </Suspense>
  );
}
