import { useLocation, Link } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="app-bg relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="pointer-events-none select-none font-heading text-8xl font-bold text-background-200">
        404
      </h1>
      <h2 className="mt-4 text-xl font-bold text-foreground-950">This page could not be found</h2>
      <p className="mt-2 font-mono text-sm text-foreground-500">{location.pathname}</p>
      <p className="mt-4 max-w-sm text-sm text-foreground-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/home"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-primary-600 px-6 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-700"
      >
        Back to Home
      </Link>
    </div>
  );
}