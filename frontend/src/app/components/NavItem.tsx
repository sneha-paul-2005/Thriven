import { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
  onClick?: () => void;
}

export function NavItem({ icon: Icon, label, to, onClick }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  const content = (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
        isActive
          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent'
      }`}
      onClick={onClick}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </div>
  );

  return onClick ? content : <Link to={to}>{content}</Link>;
}
