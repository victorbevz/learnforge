import Link from "next/link";
import type { ReactNode } from "react";

export default function WorkspaceFrame({ children, className }: { children: ReactNode; className: string }) {
  return (
    <div className="desk-frame">
      <nav className="desk-nav" aria-label="Workspace">
        <span className="desk-brand">LearnForge</span>
        <Link href="/" className="desk-courses">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6c-2.4-1.8-5.6-2.2-9-1v14c3.4-1.2 6.6-.8 9 1 2.4-1.8 5.6-2.2 9-1V5c-3.4-1.2-6.6-.8-9 1Zm0 0v14" />
          </svg>
          Courses
        </Link>
      </nav>
      <main className={`min-w-0 ${className}`}>{children}</main>
    </div>
  );
}
