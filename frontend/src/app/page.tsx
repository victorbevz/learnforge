import { redirect } from "next/navigation";

import LogoutButton from "@/components/logout-button";
import { apiFetch } from "@/lib/api";
import CreateCourseForm from "@/components/create-course-form";

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

export default async function HomePage() {
  let userResponse: Response;
  let coursesResponse: Response;

  try {
    [userResponse, coursesResponse] = await Promise.all([
      apiFetch("/auth/me"),
      apiFetch("/courses?limit=50"),
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

          {courses.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
              <h3 className="text-lg font-semibold">No courses yet</h3>
              <p className="mt-2 text-slate-400">
                Create your first course to start organizing your learning.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
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

          {courses.length === 50 && (
            <p className="mt-4 text-sm text-slate-400">
              Showing the first 50 courses.
            </p>
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