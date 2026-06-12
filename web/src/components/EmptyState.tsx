// Sanctus — Empty state component
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) => {
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 28 : 22;
  const wrapSize = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  const titleClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';
  const py = size === 'sm' ? 'py-8' : size === 'lg' ? 'py-20' : 'py-12';

  return (
    <div className={`empty-state ${py} animate-fade-in`}>
      <div className={`${wrapSize} empty-state-icon`}>
        <Icon size={iconSize} className="text-gray-400" />
      </div>
      <h3 className={`font-semibold text-gray-700 mt-1 ${titleClass}`}>{title}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-4 text-sm"
        >
          {action.icon && <action.icon size={14} />}
          {action.label}
        </button>
      )}
    </div>
  );
};