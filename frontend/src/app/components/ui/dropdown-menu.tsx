"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "./utils";

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

// Helper component to truly isolate button from parent props
const IsolatedButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => {
  return (
    <button ref={ref} type="button" {...props}>
      {children}
    </button>
  );
});
IsolatedButton.displayName = "IsolatedButton";

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>((props, ref) => {
  // Filter out ALL Figma-specific props that shouldn't be passed to DOM elements
  const {
    _fgT,
    _fgt,
    _fgS,
    _fgs,
    _fgB,
    _fgb,
    _fgC,
    _fgc,
    _fgD,
    _fgd,
    _fgE,
    _fge,
    _fgF,
    _fgf,
    _fgG,
    _fgg,
    _fgH,
    _fgh,
    _fgI,
    _fgi,
    _fgJ,
    _fgj,
    _fgK,
    _fgk,
    _fgL,
    _fgl,
    _fgM,
    _fgm,
    _fgN,
    _fgn,
    _fgO,
    _fgo,
    _fgP,
    _fgp,
    _fgQ,
    _fgq,
    _fgR,
    _fgr,
    asChild,
    children,
    className,
    onClick,
    onPointerDown,
    onKeyDown,
    disabled,
    ...cleanProps
  } = props as any;

  // If asChild is true, user is providing their own trigger element
  if (asChild) {
    return (
      <DropdownMenuPrimitive.Trigger
        ref={ref}
        asChild
        data-slot="dropdown-menu-trigger"
        className={className}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        disabled={disabled}
      >
        {children}
      </DropdownMenuPrimitive.Trigger>
    );
  }

  // Use isolated button component that won't receive Figma props
  return (
    <DropdownMenuPrimitive.Trigger
      ref={ref}
      asChild
      data-slot="dropdown-menu-trigger"
    >
      <IsolatedButton
        className={className}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        disabled={disabled}
      >
        {children}
      </IsolatedButton>
    </DropdownMenuPrimitive.Trigger>
  );
});
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName;

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  // Filter out Figma props
  const {
    _fgT,
    _fgt,
    _fgS,
    _fgs,
    _fgB,
    _fgb,
    _fgC,
    _fgc,
    _fgD,
    _fgd,
    _fgE,
    _fge,
    _fgF,
    _fgf,
    _fgG,
    _fgg,
    _fgH,
    _fgh,
    _fgI,
    _fgi,
    _fgJ,
    _fgj,
    _fgK,
    _fgk,
    _fgL,
    _fgl,
    _fgM,
    _fgm,
    _fgN,
    _fgn,
    _fgO,
    _fgo,
    _fgP,
    _fgp,
    _fgQ,
    _fgq,
    _fgR,
    _fgr,
    ...cleanProps
  } = props as any;

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className,
        )}
        {...cleanProps}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem(
  {
    className,
    inset,
    variant = "default",
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
  }
) {
  // Filter out ALL Figma-specific props that shouldn't be passed to DOM elements
  const {
    _fgT,
    _fgt,
    _fgS,
    _fgs,
    _fgB,
    _fgb,
    _fgC,
    _fgc,
    _fgD,
    _fgd,
    _fgE,
    _fge,
    _fgF,
    _fgf,
    _fgG,
    _fgg,
    _fgH,
    _fgh,
    _fgI,
    _fgi,
    _fgJ,
    _fgj,
    _fgK,
    _fgk,
    _fgL,
    _fgl,
    _fgM,
    _fgm,
    _fgN,
    _fgn,
    _fgO,
    _fgo,
    _fgP,
    _fgp,
    _fgQ,
    _fgq,
    _fgR,
    _fgr,
    ...cleanProps
  } = props as any;

  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...cleanProps}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  // Filter out Figma props
  const {
    _fgT,
    _fgt,
    _fgS,
    _fgs,
    _fgB,
    _fgb,
    _fgC,
    _fgc,
    _fgD,
    _fgd,
    _fgE,
    _fge,
    _fgF,
    _fgf,
    _fgG,
    _fgg,
    _fgH,
    _fgh,
    _fgI,
    _fgi,
    _fgJ,
    _fgj,
    _fgK,
    _fgk,
    _fgL,
    _fgl,
    _fgM,
    _fgm,
    _fgN,
    _fgn,
    _fgO,
    _fgo,
    _fgP,
    _fgp,
    _fgQ,
    _fgq,
    _fgR,
    _fgr,
    ...cleanProps
  } = props as any;

  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...cleanProps}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  // Filter out Figma props
  const {
    _fgT,
    _fgt,
    _fgS,
    _fgs,
    _fgB,
    _fgb,
    _fgC,
    _fgc,
    _fgD,
    _fgd,
    _fgE,
    _fge,
    _fgF,
    _fgf,
    _fgG,
    _fgg,
    _fgH,
    _fgh,
    _fgI,
    _fgi,
    _fgJ,
    _fgj,
    _fgK,
    _fgk,
    _fgL,
    _fgl,
    _fgM,
    _fgm,
    _fgN,
    _fgn,
    _fgO,
    _fgo,
    _fgP,
    _fgp,
    _fgQ,
    _fgq,
    _fgR,
    _fgr,
    ...cleanProps
  } = props as any;

  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...cleanProps}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  // Filter out Figma props
  const {
    _fgT,
    _fgt,
    _fgS,
    _fgs,
    _fgB,
    _fgb,
    _fgC,
    _fgc,
    _fgD,
    _fgd,
    _fgE,
    _fge,
    _fgF,
    _fgf,
    _fgG,
    _fgg,
    _fgH,
    _fgh,
    _fgI,
    _fgi,
    _fgJ,
    _fgj,
    _fgK,
    _fgk,
    _fgL,
    _fgl,
    _fgM,
    _fgm,
    _fgN,
    _fgn,
    _fgO,
    _fgo,
    _fgP,
    _fgp,
    _fgQ,
    _fgq,
    _fgR,
    _fgr,
    ...cleanProps
  } = props as any;

  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className,
      )}
      {...cleanProps}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  // Filter out Figma props
  const {
    _fgT,
    _fgt,
    _fgS,
    _fgs,
    _fgB,
    _fgb,
    _fgC,
    _fgc,
    _fgD,
    _fgd,
    _fgE,
    _fge,
    _fgF,
    _fgf,
    _fgG,
    _fgg,
    _fgH,
    _fgh,
    _fgI,
    _fgi,
    _fgJ,
    _fgj,
    _fgK,
    _fgk,
    _fgL,
    _fgl,
    _fgM,
    _fgm,
    _fgN,
    _fgn,
    _fgO,
    _fgo,
    _fgP,
    _fgp,
    _fgQ,
    _fgq,
    _fgR,
    _fgr,
    ...cleanProps
  } = props as any;

  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...cleanProps}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  // Filter out Figma props
  const {
    _fgT,
    _fgt,
    _fgS,
    _fgs,
    _fgB,
    _fgb,
    _fgC,
    _fgc,
    _fgD,
    _fgd,
    _fgE,
    _fge,
    _fgF,
    _fgf,
    _fgG,
    _fgg,
    _fgH,
    _fgh,
    _fgI,
    _fgi,
    _fgJ,
    _fgj,
    _fgK,
    _fgk,
    _fgL,
    _fgl,
    _fgM,
    _fgm,
    _fgN,
    _fgn,
    _fgO,
    _fgo,
    _fgP,
    _fgp,
    _fgQ,
    _fgq,
    _fgR,
    _fgr,
    ...cleanProps
  } = props as any;

  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...cleanProps}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
