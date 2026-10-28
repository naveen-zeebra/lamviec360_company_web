import TeamMembersClient from "./TeamMembersClient";

export const metadata = {
  title: "Team Members | Company Workspace",
  description: "Invite team members, assign roles and manage access.",
};

export default function Page() {
  return <TeamMembersClient />;
}
