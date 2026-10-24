import { StarIcon } from "./icons";

type RatingBarProps = {
  rating?: string;
  downloads?: string;
};

export function RatingBar({
  rating = "4.9 / 5.0",
  downloads = "Over 50,000+ early downloads across iOS & Android",
}: RatingBarProps) {
  return (
    <div className="mt-12 flex w-full flex-wrap items-center gap-6 border-t border-neutral-200/70 pt-6 text-xs text-neutral-500">
      <div className="flex items-center gap-1 text-amber-500">
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} className="h-4 w-4 fill-amber-400 stroke-none" />
        ))}
        <span className="ml-1.5 text-xs font-bold text-neutral-800">{rating}</span>
      </div>
      <span className="hidden text-neutral-300 sm:inline">|</span>
      <span>{downloads}</span>
    </div>
  );
}
