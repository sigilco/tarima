import { Mail } from "lucide-react";

import { Button } from "#/components/ui/button";

const VARIANTS = ["default", "destructive", "outline", "secondary", "ghost", "link"] as const;
const SIZES = ["default", "sm", "lg", "icon"] as const;

export default {
  Primary: <Button>Primary action</Button>,
  Destructive: <Button variant="destructive">Delete</Button>,
  Outline: <Button variant="outline">Outline</Button>,
  Secondary: <Button variant="secondary">Secondary</Button>,
  Ghost: <Button variant="ghost">Ghost</Button>,
  Link: <Button variant="link">Link styled</Button>,
  WithIcon: () => (
    <Button>
      <Mail />
      Send invite
    </Button>
  ),
  Disabled: <Button disabled>Disabled</Button>,
  VariantMatrix: () => (
    <div className="flex flex-wrap items-center gap-2">
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
  SizeMatrix: () => (
    <div className="flex flex-wrap items-center gap-2">
      {SIZES.map((size) => (
        <Button key={size} size={size} variant="outline">
          {size}
        </Button>
      ))}
    </div>
  ),
};
