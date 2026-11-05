import { Button } from "#/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "#/components/ui/sheet";

export default {
  Right: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Inbox</SheetTitle>
          <SheetDescription>Negotiations needing attention.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
  Left: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Left sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
