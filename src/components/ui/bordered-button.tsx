import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const borderedButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-primary transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",
        primary: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        filled: "border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "border-2 border-transparent text-foreground hover:border-foreground",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        default: "h-11 px-6 text-sm",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
      },
      shape: {
        default: "rounded-full",
        square: "rounded-none",
        rounded: "rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
);

export interface BorderedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof borderedButtonVariants> {
  asChild?: boolean;
}

const BorderedButton = React.forwardRef<HTMLButtonElement, BorderedButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(borderedButtonVariants({ variant, size, shape, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
BorderedButton.displayName = "BorderedButton";

export { BorderedButton, borderedButtonVariants };
