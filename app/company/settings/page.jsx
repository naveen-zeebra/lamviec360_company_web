import { redirect } from "next/navigation";

export const metadata = {
  title: "Settings | Company Workspace",
  description: "Company profile, security, notifications and account.",
};

export default function Page() {
  redirect("/company/settings/security");
}
