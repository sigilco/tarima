import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";

export default {
  Default: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Board settings</CardTitle>
        <CardDescription>Configure how this board behaves.</CardDescription>
      </CardHeader>
      <CardContent>Card body content.</CardContent>
      <CardFooter>
        <Button size="sm">Save</Button>
      </CardFooter>
    </Card>
  ),
};
