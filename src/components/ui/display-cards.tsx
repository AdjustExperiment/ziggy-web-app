"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-primary" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-primary",
  titleClassName,
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-40 w-[20rem] min-w-[20rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 border-border/80 bg-card shadow-xl px-4 py-3 transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-background after:to-transparent after:content-[''] after:pointer-events-none hover:border-primary/40 hover:shadow-2xl hover:z-20 [&>*]:flex [&>*]:items-center [&>*]:gap-2 isolate",
        className
      )}
    >
      <div className="relative z-[1]">
        <span className={cn("relative inline-block rounded-full bg-primary/20 p-1.5", iconClassName)}>
          {icon}
        </span>
        <p className={cn("text-lg font-semibold text-foreground", titleClassName)}>{title}</p>
      </div>
      <p className="text-foreground text-base line-clamp-2 relative z-[1]">{description}</p>
      <p className="text-muted-foreground text-sm relative z-[1]">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards: DisplayCardProps[] = [
    {
      className:
        "[grid-area:stack] hover:-translate-y-24 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-0",
    },
    {
      className:
        "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-24 hover:translate-x-16 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-0",
    },
    {
      className:
        "[grid-area:stack] translate-x-32 translate-y-20 hover:-translate-y-24 hover:translate-x-32",
    },
  ];

  const displayCards = cards ?? defaultCards;

  return (
    <div className="w-full flex justify-center">
      <div className="grid [grid-template-areas:'stack'] place-items-center justify-items-center min-w-0 max-w-full opacity-100 animate-in fade-in-0 duration-700" style={{ width: "min(100%, 42rem)" }}>
        {displayCards.map((cardProps, index) => (
          <DisplayCard key={index} {...cardProps} />
        ))}
      </div>
    </div>
  );
}

export { DisplayCard };
