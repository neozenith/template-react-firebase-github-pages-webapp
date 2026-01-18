import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const DashboardPage = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    void signOut().catch((error: unknown) => {
      console.error('Failed to sign out:', error);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back!</CardTitle>
            <CardDescription>
              You are successfully authenticated with Google SSO
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <p className="text-lg font-semibold">{user?.displayName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">User ID</h3>
              <code className="text-xs bg-muted p-2 rounded block break-all">
                {user?.uid}
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About This App</CardTitle>
            <CardDescription>
              Firebase Google SSO Authentication Template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This is a React + TypeScript + Vite application with Firebase
              Google SSO authentication, styled with Tailwind CSS and shadcn/ui
              components. The app is configured for deployment to GitHub Pages.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
