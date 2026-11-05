import { ScrollArea } from "#/components/ui/scroll-area";
import { Separator } from "#/components/ui/separator";

const ITEMS = Array.from({ length: 20 }, (_, i) => `Venue ${i + 1}`);

export default {
  Default: () => (
    <ScrollArea className="h-48 w-64 rounded-md border">
      <div className="p-4">
        {ITEMS.map((item) => (
          <div key={item}>
            <div className="py-1 text-sm">{item}</div>
            <Separator />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
