import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const boxedTextVariants = cva(
  "inline-flex items-center justify-center font-primary transition-all duration-200",
  {
    variants: {
      variant: {
        bordered: "border-2 border-foreground bg-transparent text-foreground",
        filled: "bg-primary text-primary-foreground border-2 border-primary",
        ghost: "border-2 border-transparent text-foreground",
        accent: "bg-accent text-accent-foreground border-2 border-accent",
      },
      size: {
        sm: "px-2 py-0.5 text-sm rounded-md",
        default: "px-3 py-1 text-base rounded-lg",
        lg: "px-4 py-1.5 text-lg rounded-lg",
        xl: "px-5 py-2 text-xl rounded-xl",
        hero: "px-6 py-2.5 text-2xl sm:text-3xl lg:text-4xl rounded-xl",
      },
      shape: {
        default: "",
        pill: "rounded-full",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "bordered",
      size: "default",
      shape: "default",
    },
  }
);

export interface BoxedTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof boxedTextVariants> {
  as?: "span" | "div" | "h1" | "h2" | "h3" | "h4" | "p";
}

const BoxedText = React.forwardRef<HTMLSpanElement, BoxedTextProps>(
  ({ className, variant, size, shape, as = "span", children, ...props }, ref) => {
    const Component = as;
    return (
      <Component
        className={cn(boxedTextVariants({ variant, size, shape, className }))}
        ref={ref as any}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
BoxedText.displayName = "BoxedText";

export { BoxedText, boxedTextVariants };
