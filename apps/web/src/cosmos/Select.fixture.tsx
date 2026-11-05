import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";

export default {
  Default: () => (
    <Select defaultValue="negotiating">
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Stage" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="shortlisted">Shortlisted</SelectItem>
        <SelectItem value="contacted">Contacted</SelectItem>
        <SelectItem value="negotiating">Negotiating</SelectItem>
        <SelectItem value="booked">Booked</SelectItem>
      </SelectContent>
    </Select>
  ),
};
