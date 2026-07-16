"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

const Button = ({
  children,
  variant = "default",
  size = "default",
  className,
  href,
  icon: Icon,
  iconPosition = "left",
  type = "button",
  disabled = false,
  loading = false,
  onClick,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium rounded-border transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    default:
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-border", // 🔥 Changed: bg-primary → bg-primary
    secondary: "border border-border text-foreground hover:bg-accent",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-border bg-transparent hover:bg-accent",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "px-5 py-2.5 text-sm",
    sm: "px-4 py-2 text-xs",
    lg: "px-6 py-3 text-base",
    icon: "h-10 w-10",
  };

  const classes = cn(baseStyles, variants[variant], sizes[size], className);

  const content = (
    <>
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          {children}
        </div>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className="h-4 w-4" />}
          {children}
          {Icon && iconPosition === "right" && <Icon className="h-4 w-4" />}
        </>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
