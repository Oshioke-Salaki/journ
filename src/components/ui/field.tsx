"use client";

import { createContext, use, useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type FieldContext = { id: string; descriptionId: string; errorId: string; invalid: boolean };
const Ctx = createContext<FieldContext | null>(null);

/** Gives a label, control, description and error the ids that tie them together for screen readers. */
export function Field({
  children,
  error,
  className,
  id: idProp,
}: {
  children: ReactNode;
  error?: string;
  className?: string;
  id?: string;
}) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <Ctx value={{ id, descriptionId: `${id}-description`, errorId: `${id}-error`, invalid: Boolean(error) }}>
      <div className={cn("flex flex-col gap-2", className)}>
        {children}
        {error ? (
          <p id={`${id}-error`} className="text-[13px] font-medium text-negative" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Ctx>
  );
}

export function useField() {
  return use(Ctx);
}

export function Label({ className, optional, children, ...props }: ComponentProps<"label"> & { optional?: boolean }) {
  const field = useField();
  return (
    <label htmlFor={field?.id} className={cn("text-[14px] font-medium text-ink", className)} {...props}>
      {children}
      {optional ? <span className="ml-1.5 font-normal text-faint">Optional</span> : null}
    </label>
  );
}

export function Description({ className, ...props }: ComponentProps<"p">) {
  const field = useField();
  return <p id={field?.descriptionId} className={cn("-mt-1 text-[13px] text-muted", className)} {...props} />;
}

/** Props that wire a control into its Field. */
export function useControlProps(props: { id?: string; "aria-describedby"?: string }, hasDescription = false) {
  const field = useField();
  if (!field) return {};
  const describedBy = [props["aria-describedby"], hasDescription ? field.descriptionId : null, field.invalid ? field.errorId : null]
    .filter(Boolean)
    .join(" ");
  return {
    id: props.id ?? field.id,
    "aria-invalid": field.invalid || undefined,
    "aria-describedby": describedBy || undefined,
  };
}
