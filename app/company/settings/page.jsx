import CompanySettingsClient from "./CompanySettingsClient";

export const metadata = {
  title: "Settings | Company Workspace",
  description: "Company profile, security, notifications and account.",
};

export default function Page() {
  return <CompanySettingsClient />;
}
