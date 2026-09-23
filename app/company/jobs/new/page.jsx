import JobFormClient from "../JobFormClient";

export const metadata = {
  title: "Post New Job | Company Workspace",
  description: "Create a job posting with an AI-assisted description.",
};

export default function Page() {
  return <JobFormClient mode="new" />;
}
