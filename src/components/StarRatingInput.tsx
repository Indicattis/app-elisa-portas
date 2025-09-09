import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  maxStars?: number;
  size?: number;
  className?: string;
}

export function StarRatingInput({ 
  value, 
  onChange, 
  maxStars = 5, 
  size = 20,
  className 
}: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (rating: number) => {
    onChange(rating);
  };

  const handleMouseEnter = (rating: number) => {
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[...Array(maxStars)].map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= (hoverRating || value);
        
        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            className="transition-colors hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            <Star 
              size={size}
              className={cn(
                "transition-colors cursor-pointer",
                isActive 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-muted-foreground hover:text-yellow-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}