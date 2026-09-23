import JobFormClient from "../JobFormClient";

export const metadata = {
  title: "Edit Job | Company Workspace",
  description: "Update a job posting.",
};

export default async function Page({ params }) {
  const { id } = await params;
  return <JobFormClient mode="edit" jobId={id} />;
}
