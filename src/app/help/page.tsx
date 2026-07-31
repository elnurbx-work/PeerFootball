import { InfoPage, infoMetadata } from "@/components/public/info-page";
export const metadata = infoMetadata("help");
export default function Page() { return <InfoPage contentKey="help" />; }
