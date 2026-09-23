import CompanyShell from "../../components/company/CompanyShell";

export const metadata = {
  title: "Company Workspace | LàmViệc360",
  description: "Manage jobs, candidates, your team, billing and settings.",
};

export default function CompanyLayout({ children }) {
  return <CompanyShell>{children}</CompanyShell>;
}
