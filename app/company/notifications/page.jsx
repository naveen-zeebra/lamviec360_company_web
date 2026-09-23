import CompanyNotificationsClient from "./CompanyNotificationsClient";

export const metadata = {
  title: "Notifications | Company Workspace",
  description: "Applications, interviews, team and billing updates.",
};

export default function Page() {
  return <CompanyNotificationsClient />;
}
