import Link from "next/link";
import { Users } from "lucide-react";
import { btnPrimary, Empty } from "./ui";

/** Parent pages before a child has approved the link. */
export function NoStudent() {
  return (
    <Empty icon={<Users className="h-6 w-6" />} title="Link to your child first">
      <p>Once your child approves your request, their records appear here.</p>
      <Link href="/portal/family" className={`${btnPrimary} mt-5`}>
        Link to your child
      </Link>
    </Empty>
  );
}
