import BillingClient from "./BillingClient";

export const metadata = {
  title: "Subscription & Billing | Company Workspace",
  description: "Your plan, posting limits and billing.",
};

export default function Page() {
  return <BillingClient />;
}
