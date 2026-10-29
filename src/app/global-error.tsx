"use client";

/** Last resort when the root layout itself fails. Plain styles: the app's CSS may not have loaded. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#faf8f4", color: "#15302e", margin: 0 }}>
        <main style={{ maxWidth: 520, margin: "0 auto", padding: "96px 20px" }}>
          <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>JournApp couldn&rsquo;t load</h1>
          <p style={{ fontSize: 17, lineHeight: 1.5, color: "#4f5e5c" }}>Please check your connection and try again. Your entries are safe.</p>
          <button
            onClick={reset}
            style={{ marginTop: 16, height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#1e4d4a", color: "#fff", fontSize: 15 }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
