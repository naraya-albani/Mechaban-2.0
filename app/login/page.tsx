import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";

export default function Login() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Please select a login method to access your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field>
                <Button size="icon-lg" className="gap-2">
                  <img
                    width="28"
                    height="28"
                    src="https://img.icons8.com/color/48/google-logo.png"
                    alt="google-logo"
                  />
                  Login with Google
                </Button>
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
