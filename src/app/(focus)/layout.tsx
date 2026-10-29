/** Full-screen, focused flows (check-in, writing) without the app's navigation. */
export default function FocusLayout({ children }: LayoutProps<"/">) {
  return <div className="min-h-dvh bg-surface">{children}</div>;
}
