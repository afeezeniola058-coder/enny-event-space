import { CalendarPlus, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildGoogleCalendarUrl,
  downloadIcs,
} from "@/lib/calendar-export";

interface CalendarExportButtonProps {
  title: string;
  description?: string;
  location?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  className?: string;
}

const CalendarExportButton = ({
  title,
  description,
  location,
  eventDate,
  startTime,
  endTime,
  className,
}: CalendarExportButtonProps) => {
  const event = {
    title,
    description,
    location,
    startDate: eventDate,
    startTime,
    endTime,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <CalendarPlus className="h-4 w-4 mr-2" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() =>
            window.open(buildGoogleCalendarUrl(event), "_blank", "noopener,noreferrer")
          }
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            downloadIcs(
              event,
              `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "event"}.ics`,
            )
          }
        >
          <Download className="h-4 w-4 mr-2" />
          Apple / Outlook (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CalendarExportButton;
