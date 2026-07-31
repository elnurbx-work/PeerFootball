import { InfoPage, infoMetadata } from "@/components/public/info-page";
export const metadata = infoMetadata("about");
export default function Page() { return <InfoPage contentKey="about" />; }
