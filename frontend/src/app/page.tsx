import Link from "next/link";
import WorkspaceFrame from "@/components/workspace-frame";
import { redirect } from "next/navigation";
import LearningProgress from "@/components/learning-progress";
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
    <WorkspaceFrame className="learning-workspace px-5 pb-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex min-h-16 items-center justify-end border-b border-[var(--workspace-line)] py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <span className="min-w-0 break-all text-sm text-[var(--workspace-muted)]">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </header>

        <section className="relative mt-10 sm:mt-16" aria-labelledby="courses-heading">
          <div className="pb-6 sm:pr-44">
            <h1
              id="courses-heading"
              className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
            >
              Your courses
            </h1>
            <p className="mt-3 text-base text-[var(--workspace-muted)]">
              {visibleCourses.length > 0
                ? "Open a course to pick up where you left off."
                : "Create a course to start organizing your lessons."}
            </p>
          </div>

          <CreateCourseForm />

          {visibleCourses.length === 0 ? (
            <div className="border-y border-[var(--workspace-line)] py-9">
              <h2 className="text-lg font-semibold">No courses yet</h2>
              <p className="mt-2 text-[var(--workspace-muted)]">
                Courses will appear here when you add them.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {visibleCourses.map((course, index) => (
                <li key={course.id}>
                  <Link
                    href={`/courses/${course.id}`}
                    className="group grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_1.25rem] items-start gap-x-2 gap-y-3 rounded-lg border border-[var(--workspace-line)] bg-[var(--workspace-surface)] px-4 py-4 hover:border-[var(--workspace-accent)] sm:grid-cols-[2.5rem_minmax(0,1fr)_minmax(10rem,15rem)_2rem] sm:gap-x-5 sm:px-5"
                  >
                    <span aria-hidden="true" className="pt-1 font-mono text-sm tabular-nums text-[var(--workspace-muted)]">
                      {String(offset + index + 1).padStart(2, "0")}
                    </span>
                    <div className="col-start-2 min-w-0">
                      <h2 className="break-words text-xl font-semibold tracking-tight group-hover:text-[var(--workspace-accent)]">
                        {course.title}
                      </h2>
                      {course.description && (
                        <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--workspace-muted)]">
                          {course.description}
                        </p>
                      )}
                    </div>
                    <div className="col-start-2 row-start-2 min-w-0 sm:col-start-3 sm:row-start-1">
                      <LearningProgress
                        progressPath={`/courses/${course.id}/progress`}
                        compact
                      />
                    </div>
                    <span aria-hidden="true" className="col-start-3 row-start-1 justify-self-end pt-0.5 text-xl text-[var(--workspace-accent)] sm:col-start-4">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {(page > 1 || hasNextPage) && (
            <nav
              aria-label="Course pagination"
              className="mt-6 flex items-center justify-between gap-4"
            >
              {page > 1 ? (
                <Link
                  href={page === 2 ? "/" : `/?page=${page - 1}`}
                  className="inline-flex min-h-11 items-center rounded border border-[var(--workspace-field)] px-4 text-sm hover:bg-[var(--workspace-surface)]"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}

              <span className="text-sm text-[var(--workspace-muted)]">
                Page {page}
              </span>

              {hasNextPage ? (
                <Link
                  href={`/?page=${page + 1}`}
                  className="inline-flex min-h-11 items-center rounded border border-[var(--workspace-field)] px-4 text-sm hover:bg-[var(--workspace-surface)]"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </div>
    </WorkspaceFrame>
  );
}

function ConnectionError() {
  return (
    <main className="learning-workspace flex min-h-screen items-center justify-center px-6">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">
          Unable to load your learning space
        </h1>
        <p className="mt-3 text-[var(--workspace-muted)]">
          Please try refreshing the page in a moment.
        </p>
      </div>
    </main>
  );
}
