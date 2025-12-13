import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  className?: string;
  tooltip?: string;
}

export function CircularProgress({
  value,
  size = 40,
  strokeWidth = 4,
  className,
  tooltip,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      title={tooltip}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background circle - always complete, lighter color */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={0}
          className="text-primary opacity-15"
        />
        {/* Progress circle - filled portion, stronger color */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-300"
          style={{ opacity: value > 0 ? 1 : 0 }}
        />
      </svg>
      {/* Percentage text in center */}
      <span className="absolute text-xs font-semibold text-primary">
        {Math.round(value)}%
      </span>
    </div>
  );
}

