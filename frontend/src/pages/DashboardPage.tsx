import { useAuth } from '@/contexts/AuthContext';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { useGoogleCalendars } from '@/hooks/useGoogleCalendars';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Map MIME types to friendly names and colors
 */
function getFileTypeInfo(mimeType: string): { label: string; color: string } {
  const types: Record<string, { label: string; color: string }> = {
    'application/vnd.google-apps.document': {
      label: 'Doc',
      color: 'bg-blue-100 text-blue-600',
    },
    'application/vnd.google-apps.presentation': {
      label: 'Slides',
      color: 'bg-yellow-100 text-yellow-600',
    },
    'application/vnd.google-apps.folder': {
      label: 'Folder',
      color: 'bg-gray-100 text-gray-600',
    },
    'application/vnd.google-apps.form': {
      label: 'Form',
      color: 'bg-purple-100 text-purple-600',
    },
    'application/pdf': { label: 'PDF', color: 'bg-red-100 text-red-600' },
    'image/': { label: 'Image', color: 'bg-pink-100 text-pink-600' },
    'video/': { label: 'Video', color: 'bg-indigo-100 text-indigo-600' },
  };

  for (const [key, value] of Object.entries(types)) {
    if (mimeType.startsWith(key)) return value;
  }
  return { label: 'File', color: 'bg-gray-100 text-gray-600' };
}

function SheetsPanel() {
  const { sheets, loading, error, refetch } = useGoogleSheets();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <svg
                className="w-5 h-5 text-green-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                <path d="M7 7h2v2H7zm0 4h2v2H7zm0 4h2v2H7zm4-8h6v2h-6zm0 4h6v2h-6zm0 4h6v2h-6z" />
              </svg>
              Sheets
            </CardTitle>
            <CardDescription className="text-xs">Spreadsheets</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={loading}
          >
            {loading ? '...' : '↻'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {loading && !sheets.length && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Loading...
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-xs">
            <p className="font-medium">Error</p>
            <p className="mt-1 opacity-80 truncate">{error}</p>
          </div>
        )}

        {!loading && !error && sheets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <p>No spreadsheets</p>
          </div>
        )}

        <ul className="space-y-1">
          {sheets.map((sheet) => (
            <li key={sheet.id}>
              <a
                href={
                  sheet.webViewLink ??
                  `https://docs.google.com/spreadsheets/d/${sheet.id}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors group"
              >
                {sheet.iconLink ? (
                  <img src={sheet.iconLink} alt="" className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-green-600 text-[10px] font-bold">
                      S
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {sheet.name}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CalendarsPanel() {
  const { calendars, loading, error, refetch } = useGoogleCalendars();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <svg
                className="w-5 h-5 text-blue-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM5 7V6h14v1H5zm2 4h10v2H7zm0 4h7v2H7z" />
              </svg>
              Calendars
            </CardTitle>
            <CardDescription className="text-xs">
              Your calendars
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={loading}
          >
            {loading ? '...' : '↻'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {loading && !calendars.length && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Loading...
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-xs">
            <p className="font-medium">Error</p>
            <p className="mt-1 opacity-80 truncate">{error}</p>
          </div>
        )}

        {!loading && !error && calendars.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <p>No calendars</p>
          </div>
        )}

        <ul className="space-y-1">
          {calendars.map((calendar) => (
            <li key={calendar.id}>
              <a
                href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendar.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors group"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: calendar.backgroundColor ?? '#4285f4',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {calendar.summary}
                    {calendar.primary && (
                      <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function DrivePanel() {
  const { files, loading, error, refetch } = useGoogleDrive();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <svg
                className="w-5 h-5 text-amber-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7.71 3.5L1.15 15l4.58 6h11.39l4.58-6L15.14 3.5H7.71zM5.29 15l3.56-5.85L12 13.77l3.15-4.62L18.71 15H5.29z" />
              </svg>
              Drive
            </CardTitle>
            <CardDescription className="text-xs">Recent files</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={loading}
          >
            {loading ? '...' : '↻'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {loading && !files.length && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Loading...
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-xs">
            <p className="font-medium">Error</p>
            <p className="mt-1 opacity-80 truncate">{error}</p>
          </div>
        )}

        {!loading && !error && files.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <p>No files</p>
          </div>
        )}

        <ul className="space-y-1">
          {files.map((file) => {
            const typeInfo = getFileTypeInfo(file.mimeType);
            return (
              <li key={file.id}>
                <a
                  href={
                    file.webViewLink ??
                    `https://drive.google.com/file/d/${file.id}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors group"
                >
                  {file.iconLink ? (
                    <img src={file.iconLink} alt="" className="w-4 h-4" />
                  ) : (
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center ${typeInfo.color}`}
                    >
                      <span className="text-[8px] font-bold">
                        {typeInfo.label[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {file.name}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${typeInfo.color}`}
                  >
                    {typeInfo.label}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

export const DashboardPage = () => {
  const { user, signOut, accessToken } = useAuth();

  const handleSignOut = () => {
    void signOut().catch((error: unknown) => {
      console.error('Failed to sign out:', error);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <h1 className="text-xl font-bold">{user?.displayName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>

        {/* Token Status */}
        {!accessToken && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
            <CardContent className="py-3">
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                <strong>Note:</strong> No access token available. Sign out and
                sign in again to grant access to Google APIs.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Three-Panel Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[500px]">
          <SheetsPanel />
          <CalendarsPanel />
          <DrivePanel />
        </div>
      </div>
    </div>
  );
};
