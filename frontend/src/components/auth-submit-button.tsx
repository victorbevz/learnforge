"use client";

import { useEffect, useState } from "react";

type AuthSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  isSubmitting: boolean;
};

const buttonClassName =
  "w-full rounded-lg bg-indigo-500 px-4 py-3 font-semibold transition hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-50";

export function AuthSubmitButton({ label, pendingLabel, isSubmitting }: AuthSubmitButtonProps) {
  const [status, setStatus] = useState<"checking" | "starting" | "ready" | "unavailable">("checking");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const deadline = Date.now() + 75_000;
    let timer: ReturnType<typeof setTimeout>;

    async function checkHealth() {
      const response = await fetch("/auth/health", {
        cache: "no-store",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8_000)]),
      }).catch(() => null);

      if (controller.signal.aborted) return;
      if (response?.ok) {
        setStatus("ready");
      } else if (Date.now() >= deadline) {
        setStatus("unavailable");
      } else {
        setStatus("starting");
        timer = setTimeout(checkHealth, 2_000);
      }
    }

    void checkHealth();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [retry]);

  return (
    <>
      <p role="status" className="text-sm text-slate-400 empty:hidden">
        {status === "starting" && "Starting the demo… This may take about a minute."}
        {status === "unavailable" && "The server is taking longer than expected."}
      </p>
      {status === "unavailable" ? (
        <button
          type="button"
          className={buttonClassName}
          onClick={() => {
            setStatus("checking");
            setRetry((previous) => previous + 1);
          }}
        >
          Retry connection
        </button>
      ) : (
        <button type="submit" disabled={status !== "ready" || isSubmitting} className={buttonClassName}>
          {isSubmitting ? pendingLabel : label}
        </button>
      )}
    </>
  );
}
