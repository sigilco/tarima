import { Skeleton } from "#/components/ui/skeleton";

export default {
  Default: () => (
    <div className="flex w-64 flex-col gap-3">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  ),
};
