import { PageContainer } from "@/components/shell/page";
import { NotFoundView } from "@/components/ui/not-found-view";

/** Inside the app the navigation stays, so the member is never stranded. */
export default function AppNotFound() {
  return (
    <PageContainer>
      <NotFoundView inApp />
    </PageContainer>
  );
}
