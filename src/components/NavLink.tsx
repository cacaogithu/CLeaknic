import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  icon?: LucideIcon;
  label?: string;
  mobile?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, icon: Icon, label, mobile, ...props }, ref) => {
    // If icon is provided, render icon-based navigation
    if (Icon) {
      return (
        <RouterNavLink
          ref={ref}
          to={to}
          className={({ isActive }) =>
            cn(
              mobile
                ? "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors"
                : "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-accent",
              isActive && "text-foreground bg-accent",
              className
            )
          }
          title={!mobile ? label : undefined}
          {...props}
        >
          <Icon className="h-5 w-5" />
          {mobile && <span className="text-sm font-medium">{label}</span>}
        </RouterNavLink>
      );
    }

    // Default NavLink behavior
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
