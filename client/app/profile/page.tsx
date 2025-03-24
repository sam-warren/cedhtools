import { createClient } from "../utils/supabase/server";
import LogoutButton from "../components/logout-button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default async function Profile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Profile</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">User Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-medium truncate max-w-[200px]" title={user?.id}>{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Sign In:</span>
                <span className="font-medium">
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <LogoutButton />
        </CardFooter>
      </Card>
    </div>
  );
}
