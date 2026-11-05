import { Checkbox } from "#/components/ui/checkbox";
import { Label } from "#/components/ui/label";

export default {
  Default: <Checkbox />,
  Checked: <Checkbox defaultChecked />,
  Disabled: <Checkbox disabled />,
  WithLabel: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="demo-checkbox" />
      <Label htmlFor="demo-checkbox">Include rider</Label>
    </div>
  ),
};
