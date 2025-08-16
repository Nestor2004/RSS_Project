import { NavProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomNavbar({
  onPreviousClick,
  onNextClick,
}: NavProps) {
  return (
    <div className="flex justify-between px-2 py-1">
      <button onClick={onPreviousClick} aria-label="Previous Month">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button onClick={onNextClick} aria-label="Next Month">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
