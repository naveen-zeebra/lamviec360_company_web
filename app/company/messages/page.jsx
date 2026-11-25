import { Suspense } from "react";
import CompanyMessagesClient from "./CompanyMessagesClient";

export const metadata = {
  title: "Direct Messages | LàmViệc360 Employer",
};

export default function CompanyMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-muted">Loading direct messages...</div>}>
      <CompanyMessagesClient />
    </Suspense>
  );
}
