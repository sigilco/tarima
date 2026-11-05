import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";

export default {
  Matrix: () => (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src="https://github.com/ghost.png" alt="ghost" />
        <AvatarFallback>TR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar className="size-8">
        <AvatarFallback>S</AvatarFallback>
      </Avatar>
    </div>
  ),
};
