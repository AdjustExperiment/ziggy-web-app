import { Globe, DollarSign, Clock } from "lucide-react";
import type { DisplayCardProps } from "@/components/ui/display-cards";

export const WHY_ZIGGY_STACK_CLASSES = [
  "[grid-area:stack] hover:-translate-y-24 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-0",
  "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-24 hover:translate-x-16 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:z-0",
  "[grid-area:stack] translate-x-32 translate-y-20 hover:-translate-y-24 hover:translate-x-32",
];

export const whyZiggyCards: DisplayCardProps[] = [
  {
    icon: <Globe className="h-4 w-4 text-primary" />,
    title: "Worldwide Competition",
    description: "Debate students from around the world. Easy access for remote competitors.",
    date: "Feature",
    className: WHY_ZIGGY_STACK_CLASSES[0],
  },
  {
    icon: <DollarSign className="h-4 w-4 text-primary" />,
    title: "Affordable",
    description: "Just $30–35 per tournament. We keep costs low and avoid raising prices.",
    date: "Feature",
    className: WHY_ZIGGY_STACK_CLASSES[1],
  },
  {
    icon: <Clock className="h-4 w-4 text-primary" />,
    title: "Flexibility",
    description: "Coordinate when to debate with your opponent for maximum scheduling freedom.",
    date: "Feature",
    className: WHY_ZIGGY_STACK_CLASSES[2],
  },
];
