import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) redirect("/en/login");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-on-surface-variant">
          Calendar management is coming soon. You will be able to set your
          available time slots here so clients can book meetings with you.
        </p>
      </CardContent>
    </Card>
  );
}
