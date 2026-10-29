import Link from "next/link";
import { Button } from "../components/ds";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-page">
      <div className="max-w-md space-y-4">
        <h1 className="text-4xl font-black text-ink">404</h1>
        <h2 className="text-xl font-bold text-ink">Page Not Found</h2>
        <p className="text-sm text-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Link href="/company/overview">
            <Button variant="primary" size="md">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

