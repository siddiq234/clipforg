import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import JobView from "./components/JobView";
import ResultsGrid from "./components/ResultsGrid";
import ClipModal from "./components/ClipModal";
import { createJob, getJob } from "./api";
import type { Clip, Job } from "./types";

type Screen = "home" | "job";

const POLL_INTERVAL_MS = 2000;

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [job, setJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Clip | null>(null);
  const pollRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Stop polling if the component unmounts.
  useEffect(() => stopPolling, [stopPolling]);

  const handleSubmit = useCallback(
    async (url: string) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const created = await createJob(url, 5);
        const initial = await getJob(created.job_id);
        setJob(initial);
        setScreen("job");

        stopPolling();
        pollRef.current = window.setInterval(async () => {
          try {
            const updated = await getJob(created.job_id);
            setJob(updated);
            if (updated.status === "done" || updated.status === "error") {
              stopPolling();
            }
          } catch {
            // Transient network blip — keep polling.
          }
        }, POLL_INTERVAL_MS);
      } catch (err) {
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Couldn't start the job. Is the backend running?",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [stopPolling],
  );

  const handleReset = useCallback(() => {
    stopPolling();
    setJob(null);
    setSelected(null);
    setSubmitError(null);
    setScreen("home");
  }, [stopPolling]);

  const inJob = screen === "job" && job !== null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f]">
      <Header onHome={handleReset} showNewClip={inJob} />
      <main className="flex-1 pb-24">
        {!inJob && (
          <Hero
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
          />
        )}
        {inJob && job.status !== "done" && (
          <JobView job={job} onReset={handleReset} />
        )}
        {inJob && job.status === "done" && (
          <ResultsGrid
            videoTitle={job.video_title}
            clips={job.clips}
            onSelect={setSelected}
            onReset={handleReset}
          />
        )}
      </main>
      <Footer />
      {selected && (
        <ClipModal clip={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
