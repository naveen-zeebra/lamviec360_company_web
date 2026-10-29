import { Suspense } from "react";
import TalentSearchClient from "./TalentSearchClient";

export const metadata = {
  title: "Talent Search | LàmViệc360",
  description: "Search and discover qualified Job Seeker talent profiles for your open roles.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TalentSearchClient />
    </Suspense>
  );
}
