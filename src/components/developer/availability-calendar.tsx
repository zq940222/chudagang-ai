"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { setAvailability, deleteAvailabilitySlot } from "@/lib/actions/availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";

type Slot = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  note: string | null;
};

type NewSlot = {
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BUSY" | "TENTATIVE" | "BLOCKED";
  note: string;
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  BUSY: "bg-red-100 text-red-800 border-red-200",
  TENTATIVE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  BLOCKED: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_DOTS: Record<string, string> = {
  AVAILABLE: "bg-emerald-500",
  BUSY: "bg-red-500",
  TENTATIVE: "bg-yellow-500",
  BLOCKED: "bg-gray-400",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function slotsByDate(slots: Slot[]): Record<string, Slot[]> {
  const map: Record<string, Slot[]> = {};
  for (const s of slots) {
    const key = toDateString(new Date(s.date));
    if (!map[key]) map[key] = [];
    map[key].push(s);
  }
  return map;
}

export function AvailabilityCalendar({ initialSlots }: { initialSlots: Slot[] }) {
  const t = useTranslations("calendar");
  const [isPending, startTransition] = useTransition();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [newSlot, setNewSlot] = useState<NewSlot>({
    startTime: "09:00",
    endTime: "17:00",
    status: "AVAILABLE",
    note: "",
  });

  const slotMap = slotsByDate(slots);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthName = new Date(year, month, 1).toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  function handleDayClick(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(prev => prev === dateStr ? null : dateStr);
  }

  function handleAddSlot() {
    if (!selectedDate) return;
    const existingForDate = slotMap[selectedDate] ?? [];
    startTransition(async () => {
      try {
        await setAvailability({
          slots: [
            // preserve all existing slots for this date
            ...existingForDate.map(s => ({
              date: selectedDate,
              startTime: s.startTime,
              endTime: s.endTime,
              status: s.status,
              note: s.note ?? undefined,
            })),
            // append the new slot
            {
              date: selectedDate,
              startTime: newSlot.startTime,
              endTime: newSlot.endTime,
              status: newSlot.status,
              note: newSlot.note || undefined,
            },
          ],
        });
        const added: Slot = {
          id: crypto.randomUUID(),
          date: new Date(selectedDate),
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          status: newSlot.status,
          note: newSlot.note || null,
        };
        setSlots(prev => [...prev, added]);
        toast.success(t("saved"));
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  function handleDelete(slotId: string) {
    startTransition(async () => {
      try {
        await deleteAvailabilitySlot(slotId);
        setSlots(prev => prev.filter(s => s.id !== slotId));
      } catch {
        toast.error("Failed to delete");
      }
    });
  }

  const selectedSlots = selectedDate ? (slotMap[selectedDate] ?? []) : [];

  const statusLabel: Record<string, string> = {
    AVAILABLE: t("statusAvailable"),
    BUSY: t("statusBusy"),
    TENTATIVE: t("statusTentative"),
    BLOCKED: t("statusBlocked"),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={prevMonth} className="h-8 px-3 text-sm">
                {t("prevMonth")}
              </Button>
              <Button variant="secondary" onClick={nextMonth} className="h-8 px-3 text-sm">
                {t("nextMonth")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-1 text-xs font-medium text-on-surface-variant">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const daySlots = slotMap[dateStr] ?? [];
              const isSelected = selectedDate === dateStr;
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative m-0.5 flex flex-col items-center rounded-lg p-1.5 text-sm transition-colors
                    ${isSelected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-surface-container"}
                    ${isToday ? "font-bold text-primary" : "text-on-surface"}
                  `}
                >
                  <span>{day}</span>
                  {daySlots.length > 0 && (
                    <div className="mt-0.5 flex gap-0.5">
                      {daySlots.slice(0, 3).map(s => (
                        <span
                          key={s.id}
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[s.status] ?? "bg-gray-400"}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(statusLabel).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className={`h-2 w-2 rounded-full ${STATUS_DOTS[key]}`} />
                {label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Side Panel */}
      <div className="space-y-4">
        {selectedDate ? (
          <>
            {/* Existing slots */}
            {selectedSlots.length > 0 && (
              <Card>
                <CardContent className="pt-4 space-y-2">
                  {selectedSlots.map(slot => (
                    <div
                      key={slot.id}
                      className={`flex items-start justify-between rounded-lg border p-2.5 text-xs ${STATUS_COLORS[slot.status] ?? ""}`}
                    >
                      <div>
                        <p className="font-medium">
                          {slot.startTime} – {slot.endTime}
                        </p>
                        <p className="mt-0.5 opacity-80">{statusLabel[slot.status]}</p>
                        {slot.note && <p className="mt-1 opacity-70">{slot.note}</p>}
                      </div>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        disabled={isPending}
                        className="ml-2 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
                        title={t("delete")}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Add new slot form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedDate}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">{t("startTime")}</Label>
                    <Input
                      type="time"
                      value={newSlot.startTime}
                      onChange={e => setNewSlot(p => ({ ...p, startTime: e.target.value }))}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("endTime")}</Label>
                    <Input
                      type="time"
                      value={newSlot.endTime}
                      onChange={e => setNewSlot(p => ({ ...p, endTime: e.target.value }))}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">{t("status")}</Label>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    {(["AVAILABLE", "BUSY", "TENTATIVE", "BLOCKED"] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setNewSlot(p => ({ ...p, status: s }))}
                        className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                          newSlot.status === s
                            ? STATUS_COLORS[s]
                            : "border-transparent bg-surface-container text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        {statusLabel[s]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs">{t("note")}</Label>
                  <Textarea
                    value={newSlot.note}
                    onChange={e => setNewSlot(p => ({ ...p, note: e.target.value }))}
                    placeholder={t("notePlaceholder")}
                    rows={2}
                    className="mt-1 text-sm resize-none"
                  />
                </div>

                <Button
                  onClick={handleAddSlot}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? t("saving") : t("addSlot")}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-on-surface-variant">
                {t("noSlots")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
