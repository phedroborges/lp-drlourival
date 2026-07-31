import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name = "") {
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

/** Substitui os divs de iniciais repetidos pelo app (.person-avatar, .profile-avatar, etc). */
export function InitialsAvatar({ name, size = "default", className, fallbackClassName }) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback className={fallbackClassName}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
