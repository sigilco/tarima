import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";

export default {
  Default: () => (
    <Command className="w-80 rounded-lg border shadow">
      <CommandInput placeholder="Search actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Board">
          <CommandItem>Add row</CommandItem>
          <CommandItem>Import CSV</CommandItem>
          <CommandItem>Share board</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
