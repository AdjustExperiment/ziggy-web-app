import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const themedSectionVariants = cva(
  "relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        hero: "bg-gradient-hero text-foreground",
        subtle: "bg-gradient-subtle text-foreground",
        muted: "bg-muted/20 text-foreground",
        card: "bg-card text-card-foreground",
        accent: "bg-accent text-accent-foreground",
        dark: "bg-card text-card-foreground",
        inverted: "bg-foreground text-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ThemedSectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof themedSectionVariants> {
  as?: "section" | "div" | "article" | "main" | "aside";
}

const ThemedSection = React.forwardRef<HTMLElement, ThemedSectionProps>(
  ({ className, variant, as = "section", children, ...props }, ref) => {
    const Component = as;
    return (
      <Component
        className={cn(themedSectionVariants({ variant, className }))}
        ref={ref as any}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
ThemedSection.displayName = "ThemedSection";

export { ThemedSection, themedSectionVariants };
