import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium",
    "transition-[background-color,color,box-shadow,transform,opacity] duration-150 ease-out",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "[&_svg]:size-[18px] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover",
        secondary: "bg-raised text-ink hover:bg-active",
        outline: "border border-control bg-surface text-ink hover:bg-raised",
        ghost: "text-ink hover:bg-raised",
        danger: "border border-negative/40 bg-surface text-negative hover:bg-negative-soft",
        "danger-solid": "bg-negative text-white hover:opacity-90",
        link: "h-auto rounded-md px-0 text-accent-ink underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-9 px-4 text-[14px]",
        md: "h-11 px-5 text-[15px]",
        lg: "h-[52px] px-7 text-[16px]",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows a spinner, keeps the button's width and blocks repeat presses. */
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>{children}</span>
          {loading ? (
            <span className="absolute inset-0 grid place-items-center">
              <Spinner />
            </span>
          ) : null}
        </>
      )}
    </Comp>
  );
}
