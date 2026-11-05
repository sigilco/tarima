import { Badge } from "#/components/ui/badge";

const VARIANTS = ["default", "secondary", "destructive", "outline"] as const;

export default {
  Matrix: () => (
    <div className="flex flex-wrap gap-2">
      {VARIANTS.map((v) => (
        <Badge key={v} variant={v}>
          {v}
        </Badge>
      ))}
    </div>
  ),
};
