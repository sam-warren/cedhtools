import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>cedhtools</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Upload Decklist</Button>
      </CardContent>
    </Card>
  );
}
