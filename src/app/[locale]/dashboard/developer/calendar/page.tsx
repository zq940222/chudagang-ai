import { auth } from "@/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getMyAvailability } from "@/lib/actions/availability";
import { AvailabilityCalendar } from "@/components/developer/availability-calendar";

export default async function CalendarPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("calendar");

  const currentMonth = new Date().toISOString().slice(0, 7);
  const slots = await getMyAvailability(currentMonth);

  const serialized = slots.map((s: typeof slots[number]) => ({
    id: s.id,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    status: s.status,
    note: s.note,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">{t("title")}</h1>
      <AvailabilityCalendar initialSlots={serialized} />
    </div>
  );
}
