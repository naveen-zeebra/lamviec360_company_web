import JobsManageClient from "./JobsManageClient";

export const metadata = {
  title: "Job Management | Company Workspace",
  description: "Create, publish, pause and close your job postings.",
};

export default function Page() {
  return <JobsManageClient />;
}
