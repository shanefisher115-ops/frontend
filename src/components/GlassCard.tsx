import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  interactive = false,
  glowColor,
  style,
  ...props
}) => {
  const combinedClassName = [
    "glass-card",
    interactive ? "glass-card--interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(glowColor ? { boxShadow: `0 8px 32px 0 rgba(0,0,0,0.37), 0 0 20px ${glowColor}` } : {}),
  };

  return (
    <div className={combinedClassName} style={combinedStyle} {...props}>
      {children}
    </div>
  );
};
