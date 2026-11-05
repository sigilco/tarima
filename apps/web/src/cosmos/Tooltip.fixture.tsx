import { Button } from "#/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";

export default {
  Default: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>Sends the brief to the venue.</TooltipContent>
    </Tooltip>
  ),
};
