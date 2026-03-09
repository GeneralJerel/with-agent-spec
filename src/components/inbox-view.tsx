export interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  isRead: boolean;
}

interface InboxViewProps {
  emails: Email[];
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-teal-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(from: string): string {
  const name = from.split("@")[0].split(".")[0];
  return (name[0] || "?").toUpperCase();
}

function getSenderName(from: string): string {
  const local = from.split("@")[0];
  return local
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function InboxView({ emails }: InboxViewProps) {
  return (
    <div className="max-w-md w-full rounded-xl shadow-lg bg-white overflow-hidden my-3">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">Inbox</h2>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {emails.length} message{emails.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Email list */}
      <div className="divide-y divide-gray-50">
        {emails.map((email) => (
          <div
            key={email.id}
            className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer relative"
          >
            {/* Unread indicator */}
            {!email.isRead && (
              <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}

            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-full ${getAvatarColor(email.from)} flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-0.5`}
            >
              {getInitial(email.from)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className={`text-sm truncate ${email.isRead ? "text-gray-600" : "text-gray-900 font-semibold"}`}>
                  {getSenderName(email.from)}
                </p>
                <span className="text-xs text-gray-400 shrink-0">{email.date}</span>
              </div>
              <p className={`text-sm truncate ${email.isRead ? "text-gray-500" : "text-gray-800 font-medium"}`}>
                {email.subject}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{email.preview}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InboxLoadingState() {
  return (
    <div className="max-w-md w-full rounded-xl shadow-lg bg-white overflow-hidden my-3 animate-pulse">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <div className="w-5 h-5 bg-gray-200 rounded" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
              <div className="h-2.5 w-36 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 pb-3 text-xs text-gray-400">Checking inbox...</div>
    </div>
  );
}
