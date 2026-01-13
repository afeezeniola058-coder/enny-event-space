import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ReviewCardProps {
  name: string;
  rating: number;
  comment: string;
  date: string;
  hallName?: string;
}

const ReviewCard = ({ name, rating, comment, date, hallName }: ReviewCardProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-foreground">{name}</h4>
              {hallName && (
                <p className="text-xs text-muted-foreground">{hallName}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            "{comment}"
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{date}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
