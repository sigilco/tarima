import { toast } from "sonner";

import { Button } from "#/components/ui/button";

export default {
  Default: () => <Button onClick={() => toast("Board saved.")}>Show toast</Button>,
  Success: () => (
    <Button variant="outline" onClick={() => toast.success("Venue booked.")}>
      Success toast
    </Button>
  ),
  Error: () => (
    <Button variant="destructive" onClick={() => toast.error("Send failed.")}>
      Error toast
    </Button>
  ),
};
