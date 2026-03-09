"use client";

import { useState } from "react";

export interface CalendarEvent {
  startTime: string;
  endTime: string;
  title: string;
  isAvailable: boolean;
}

interface CalendarViewProps {
  date: string;
  dayName: string;
  events: CalendarEvent[];
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m ? `${display}:${String(m).padStart(2, "0")} ${suffix}` : `${display} ${suffix}`;
}

function formatTimeShort(t: string): string {
  const [h] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display} ${suffix}`;
}

function getDuration(start: string, end: string): string {
  if (!end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
  if (mins >= 60) return `${mins / 60}h`;
  return `${mins}m`;
}

function formatDateBadge(date: string, dayName: string): string {
  try {
    const d = new Date(date + "T00:00:00");
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate();
    return `${dayName.slice(0, 3)}, ${month} ${day}`;
  } catch {
    return date;
  }
}

export function CalendarView({ date, dayName, events }: CalendarViewProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const bookedCount = events.filter((e) => !e.isAvailable).length;

  return (
    <div className="max-w-md w-full rounded-xl shadow-lg bg-white overflow-hidden my-3">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">Schedule</h2>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {formatDateBadge(date, dayName)} · {bookedCount} event{bookedCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Event list */}
      <div className="divide-y divide-gray-50">
        {events.map((event, i) => {
          const isExpanded = selected === i;
          const isBooked = !event.isAvailable;

          return (
            <div key={i}>
              <div
                className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                  isBooked ? "hover:bg-gray-50 cursor-pointer" : ""
                } ${isExpanded ? "bg-gray-50" : ""}`}
                onClick={() => {
                  if (isBooked) setSelected(isExpanded ? null : i);
                }}
              >
                {/* Time */}
                <div className="w-20 shrink-0 text-xs text-gray-400 text-right">
                  {formatTimeShort(event.startTime)}
                  {event.endTime && (
                    <>
                      <span className="mx-0.5">–</span>
                      {formatTimeShort(event.endTime)}
                    </>
                  )}
                </div>

                {/* Dot */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isBooked ? "bg-indigo-500" : "bg-gray-200"
                  }`}
                />

                {/* Title */}
                <p
                  className={`flex-1 text-sm truncate ${
                    isBooked ? "text-gray-900 font-medium" : "text-gray-400"
                  }`}
                >
                  {event.title}
                </p>

                {/* Duration badge */}
                {isBooked && event.endTime && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                    {getDuration(event.startTime, event.endTime)}
                  </span>
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && isBooked && (
                <div className="px-5 pb-3 pt-0 ml-[calc(5rem+1.25rem)] border-l-2 border-indigo-200">
                  <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(event.startTime)}
                    {event.endTime && ` – ${formatTime(event.endTime)}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">No additional details</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarLoadingState() {
  return (
    <div className="max-w-md w-full rounded-xl shadow-lg bg-white overflow-hidden my-3 animate-pulse">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <div className="w-5 h-5 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <div className="w-20 h-3 bg-gray-100 rounded shrink-0" />
            <div className="w-2 h-2 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 h-3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      <div className="px-5 pb-3 text-xs text-gray-400">Loading schedule...</div>
    </div>
  );
}
