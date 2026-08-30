interface AvatarProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function Avatar({ name, avatar, size = 'md', className = '' }: AvatarProps) {
  const initials = avatar || name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 ${sizeClasses[size]} ${className}`}>
      {initials}
    </div>
  );
}
