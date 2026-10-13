import Link from "next/link";
import { redirect } from "next/navigation";

import CreateCourseForm from "@/components/create-course-form";
import LogoutButton from "@/components/logout-button";
import { apiFetch } from "@/lib/api";

type User = {
  id: number;
  email: string;
};

type Course = {
  id: number;
  owner_id: number;
  title: string;
  description: string | null;
};

const PAGE_SIZE = 12;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawPage = params.page;

  const page = rawPage === undefined ? 1 : Number(rawPage);

  if (
    Array.isArray(rawPage) ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100_000
  ) {
    redirect("/");
  }

  const offset = (page - 1) * PAGE_SIZE;

  let userResponse: Response;
  let coursesResponse: Response;

  try {
    [userResponse, coursesResponse] = await Promise.all([
      apiFetch("/auth/me"),
      apiFetch(`/courses?limit=${PAGE_SIZE + 1}&offset=${offset}`),
    ]);
  } catch {
    return <ConnectionError />;
  }

  if (userResponse.status === 401 || coursesResponse.status === 401) {
    redirect("/login");
  }

  if (!userResponse.ok || !coursesResponse.ok) {
    return <ConnectionError />;
  }

  let user: User;
  let courses: Course[];

  try {
    user = await userResponse.json();
    courses = await coursesResponse.json();
  } catch {
    return <ConnectionError />;
  }

  if (courses.length === 0 && page > 1) {
    redirect("/");
  }

  const hasNextPage = courses.length > PAGE_SIZE;
  const visibleCourses = courses.slice(0, PAGE_SIZE);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold tracking-widest text-indigo-400">
              LEARNFORGE
            </p>

            <h1 className="mt-4 text-3xl font-bold">
              Your learning space
            </h1>

            <p className="mt-3 text-slate-400">
              Signed in as{" "}
              <span className="font-medium text-slate-100">
                {user.email}
              </span>
            </p>
          </div>

          <LogoutButton />
        </header>

        <CreateCourseForm />

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Your courses</h2>

          {visibleCourses.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
              <h3 className="text-lg font-semibold">No courses yet</h3>
              <p className="mt-2 text-slate-400">
                Create your first course to start organizing your learning.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCourses.map((course) => (
                <article
                  key={course.id}
                  className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <h3 className="break-words text-xl font-semibold">
                    {course.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                    {course.description || "No description yet."}
                  </p>
                </article>
              ))}
            </div>
          )}

          {(page > 1 || hasNextPage) && (
            <nav
              aria-label="Course pagination"
              className="mt-6 flex items-center justify-between gap-4"
            >
              {page > 1 ? (
                <Link
                  href={page === 2 ? "/" : `/?page=${page - 1}`}
                  className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}

              <span className="text-sm text-slate-400">
                Page {page}
              </span>

              {hasNextPage ? (
                <Link
                  href={`/?page=${page + 1}`}
                  className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </section>
    </main>
  );
}

function ConnectionError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-2xl font-bold">
          Unable to load your learning space
        </h1>
        <p className="mt-3 text-slate-400">
          Please try refreshing the page in a moment.
        </p>
      </div>
    </main>
  );
}