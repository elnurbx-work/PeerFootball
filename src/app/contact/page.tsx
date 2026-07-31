import { InfoPage, infoMetadata } from "@/components/public/info-page";
import { ContactForm } from "@/components/public/contact-form";
export const metadata = infoMetadata("contact");
export default function Page() { return <InfoPage contentKey="contact"><ContactForm /></InfoPage>; }
