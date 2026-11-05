import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";

export default {
  Default: <Switch />,
  Checked: <Switch defaultChecked />,
  Disabled: <Switch disabled />,
  WithLabel: () => (
    <div className="flex items-center gap-2">
      <Switch id="demo-switch" />
      <Label htmlFor="demo-switch">Notify on reply</Label>
    </div>
  ),
};
