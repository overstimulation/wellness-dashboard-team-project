"use client";

import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";

import { cn } from "@/lib/utils";

type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  children?: React.ReactNode;
};

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, children, value, onChange, id, ...props }, ref) => {
    const placeholder = (props as any).placeholder ?? "Select...";
    const options = React.Children.toArray(children)
      .filter(React.isValidElement)
      .map((ch: any) => ({
        value: String(ch.props.value ?? ""),
        label: ch.props.children ?? String(ch.props.value ?? ""),
      }))
      // Radix requires items to have a non-empty string value. Filter out empty values
      .filter((o) => o.value !== "");

    return (
      <RadixSelect.Root
        value={String(value ?? "")}
        onValueChange={(v: string) => {
          if (onChange) {
            const ev = {
              target: { value: v },
            } as unknown as React.ChangeEvent<HTMLSelectElement>;
            onChange(ev);
          }
        }}
      >
        <RadixSelect.Trigger
          ref={ref as any}
          id={id}
          className={cn(
            // match Input look
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            // layout for trigger content + icon
            "inline-flex items-center justify-between gap-2",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            className
          )}
          {...(props as any)}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 10l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className={cn(
              "z-50 mt-2 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg",
              "max-h-60 overflow-auto"
            )}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((o) => (
                <RadixSelect.Item
                  key={o.value}
                  value={o.value}
                  className={cn(
                    "relative flex items-center px-3 py-2 cursor-pointer select-none rounded text-sm",
                    // highlighted (keyboard/hover) and checked (selected) states using Radix data attributes
                    "data-[highlighted]:bg-accent/10 data-[highlighted]:text-accent-foreground",
                    "data-[state=checked]:bg-accent/10 data-[state=checked]:font-medium",
                    // keep dark-mode hover tweak
                    "dark:data-[highlighted]:bg-accent/20"
                  )}
                >
                  <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="ml-auto">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    );
  }
);

Select.displayName = "Select";

export { Select };
