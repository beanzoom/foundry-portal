import { useMemo } from 'react';

interface UserAvatarProps {
  firstName: string | null;
  lastName: string | null;
  email: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  className?: string;
}

/**
 * UserAvatar component - displays user initials with consistent color coding
 * Similar to Jira's avatar system
 */
export function UserAvatar({
  firstName,
  lastName,
  email,
  size = 'md',
  onClick,
  className = ''
}: UserAvatarProps) {

  // Generate initials
  const initials = useMemo(() => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (lastName) {
      return lastName.substring(0, 2).toUpperCase();
    } else {
      // Use first 2 chars of email
      return email.substring(0, 2).toUpperCase();
    }
  }, [firstName, lastName, email]);

  // Generate consistent color based on email (so same user always gets same color)
  const colorScheme = useMemo(() => {
    const colors = [
      { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
      { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
      { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
      { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
      { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600' },
      { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600' },
      { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600' },
      { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
      { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-600' },
      { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
      { bg: 'bg-lime-500', text: 'text-white', border: 'border-lime-600' },
      { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' },
      { bg: 'bg-sky-500', text: 'text-white', border: 'border-sky-600' },
      { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-600' },
      { bg: 'bg-fuchsia-500', text: 'text-white', border: 'border-fuchsia-600' },
      { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600' },
      { bg: 'bg-slate-500', text: 'text-white', border: 'border-slate-600' },
      { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600' },
      { bg: 'bg-zinc-500', text: 'text-white', border: 'border-zinc-600' },
      { bg: 'bg-stone-500', text: 'text-white', border: 'border-stone-600' },
    ];

    // Generate hash from email for consistent color selection
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;

    return colors[index];
  }, [email]);

  // Size variants
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };

  const displayName = useMemo(() => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName || lastName) {
      return firstName || lastName;
    } else {
      return email;
    }
  }, [firstName, lastName, email]);

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorScheme.bg}
        ${colorScheme.text}
        border-2
        ${colorScheme.border}
        rounded-full
        flex
        items-center
        justify-center
        font-semibold
        flex-shrink-0
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${className}
      `}
      onClick={onClick}
      title={displayName}
    >
      {initials}
    </div>
  );
}

/**
 * UserAvatarGroup - displays multiple user avatars in a row with overlap
 */
interface UserAvatarGroupProps {
  users: Array<{
    firstName: string | null;
    lastName: string | null;
    email: string;
  }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onUserClick?: (index: number) => void;
}

export function UserAvatarGroup({ users, max = 5, size = 'md', onUserClick }: UserAvatarGroupProps) {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {displayUsers.map((user, index) => (
        <UserAvatar
          key={user.email}
          firstName={user.firstName}
          lastName={user.lastName}
          email={user.email}
          size={size}
          onClick={() => onUserClick?.(index)}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${size === 'sm' ? 'w-6 h-6 text-xs' : ''}
            ${size === 'md' ? 'w-8 h-8 text-sm' : ''}
            ${size === 'lg' ? 'w-10 h-10 text-base' : ''}
            ${size === 'xl' ? 'w-12 h-12 text-lg' : ''}
            bg-gray-200
            text-gray-600
            rounded-full
            flex
            items-center
            justify-center
            font-semibold
            flex-shrink-0
            ring-2
            ring-white
          `}
          title={`${remaining} more user${remaining !== 1 ? 's' : ''}`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
