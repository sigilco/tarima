import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";

export default {
  Default: <Label>Project name</Label>,
  WithControl: () => (
    <div className="grid gap-2">
      <Label htmlFor="demo-email">Email</Label>
      <Input id="demo-email" placeholder="you@example.com" />
    </div>
  ),
};
