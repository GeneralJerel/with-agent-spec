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

function parseHour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + (m || 0) / 60;
}

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display} ${suffix}`;
}

function formatTimeRange(start: string, end: string): string {
  const format = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m ? `${display}:${String(m).padStart(2, "0")} ${suffix}` : `${display} ${suffix}`;
  };
  if (!end) return format(start);
  return `${format(start)} – ${format(end)}`;
}

const HOUR_HEIGHT = 60;
const START_HOUR = 8;
const END_HOUR = 18;

export function CalendarView({ date, dayName, events }: CalendarViewProps) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const showCurrentTime = currentHour >= START_HOUR && currentHour < END_HOUR;

  const formatted = (() => {
    try {
      const d = new Date(date + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } catch {
      return date;
    }
  })();

  return (
    <div className="max-w-md w-full rounded-xl shadow-lg bg-white overflow-hidden my-3">
      {/* Header */}
      <div className="bg-indigo-600 px-5 py-4 text-white">
        <p className="text-indigo-200 text-sm font-medium uppercase tracking-wide">{dayName}</p>
        <p className="text-xl font-bold mt-0.5">{formatted}</p>
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[480px] relative">
        <div className="relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
          {/* Hour lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex items-start"
              style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
            >
              <div className="w-16 shrink-0 pr-2 text-right text-xs text-gray-400 -mt-2">
                {formatHour(hour)}
              </div>
              <div className="flex-1 border-t border-gray-100" />
            </div>
          ))}

          {/* Events */}
          {events.map((event, i) => {
            const start = parseHour(event.startTime);
            const end = event.endTime ? parseHour(event.endTime) : start + 0.5;
            const top = (start - START_HOUR) * HOUR_HEIGHT;
            const height = Math.max((end - start) * HOUR_HEIGHT - 2, 24);

            if (event.isAvailable) {
              return (
                <div
                  key={i}
                  className="absolute left-16 right-3 rounded-lg border border-dashed border-green-300 bg-green-50 px-3 py-1.5 text-green-700 text-xs flex items-center"
                  style={{ top, height }}
                >
                  Available
                </div>
              );
            }

            return (
              <div
                key={i}
                className="absolute left-16 right-3 rounded-lg bg-indigo-500 text-white px-3 py-1.5 shadow-sm overflow-hidden"
                style={{ top, height }}
              >
                <p className="font-semibold text-sm leading-tight truncate">{event.title}</p>
                {height > 30 && (
                  <p className="text-indigo-200 text-xs mt-0.5">
                    {formatTimeRange(event.startTime, event.endTime)}
                  </p>
                )}
              </div>
            );
          })}

          {/* Current time indicator */}
          {showCurrentTime && (
            <div
              className="absolute left-14 right-0 flex items-center z-10"
              style={{ top: (currentHour - START_HOUR) * HOUR_HEIGHT }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CalendarLoadingState() {
  return (
    <div className="max-w-md w-full rounded-xl shadow-lg bg-white overflow-hidden my-3 animate-pulse">
      <div className="bg-indigo-600 px-5 py-4">
        <div className="h-3 w-20 bg-indigo-400 rounded mb-2" />
        <div className="h-5 w-40 bg-indigo-400 rounded" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-14 h-3 bg-gray-200 rounded" />
            <div className="flex-1 h-10 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="px-5 pb-3 text-xs text-gray-400">Loading schedule...</div>
    </div>
  );
}
