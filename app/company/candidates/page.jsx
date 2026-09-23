import { Suspense } from "react";
import CandidatesClient from "./CandidatesClient";

export const metadata = {
  title: "Candidate Pipeline | Company Workspace",
  description: "Move candidates through your hiring pipeline.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CandidatesClient />
    </Suspense>
  );
}
