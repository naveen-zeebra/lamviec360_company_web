import RolesClient from "./RolesClient";

export const metadata = {
  title: "Roles & Permissions | Company Workspace",
  description: "Predefined roles, granular permission governance, and access control.",
};

export default function Page() {
  return <RolesClient />;
}
