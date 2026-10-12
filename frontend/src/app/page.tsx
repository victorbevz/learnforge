import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";

type User = {
  id: number;
  email: string;
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const apiUrl = process.env.API_URL ?? "http://127.0.0.1:8000";

  let response: Response;

  try {
    response = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return <ConnectionError />;
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return <ConnectionError />;
  }

  const user: User = await response.json();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold tracking-widest text-indigo-400">
          LEARNFORGE
        </p>

        <h1 className="mt-4 text-3xl font-bold">Your learning space</h1>

        <p className="mt-3 text-slate-400">
          Signed in as{" "}
          <span className="font-medium text-slate-100">{user.email}</span>
        </p>

        <div className="mt-6">
          <LogoutButton />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Your courses</h2>
          <p className="mt-2 text-slate-400">
            Your course dashboard is coming next.
          </p>
        </div>
      </section>
    </main>
  );
}

function ConnectionError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Unable to load your account</h1>
        <p className="mt-3 text-slate-400">
          Please check that the backend is running and refresh the page.
        </p>
      </div>
    </main>
  );
}