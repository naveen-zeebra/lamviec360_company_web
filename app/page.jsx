import EmployersClient from "./(employer)/employers/EmployersClient";

export const metadata = {
  title: "For Employers | LàmViệc360 - Smart Recruitment Platform",
  description: "Post jobs, track candidate ATS pipelines, and hire top talent in Vietnam.",
};

export default function Page() {
  return <EmployersClient />;
}
