import { Separator } from "#/components/ui/separator";

export default {
  Horizontal: (
    <div className="w-64">
      <div className="py-2">Above</div>
      <Separator />
      <div className="py-2">Below</div>
    </div>
  ),
  Vertical: (
    <div className="flex h-12 items-center gap-4">
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};
