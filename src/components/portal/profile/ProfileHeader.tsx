import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit, Calendar, Building, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
    role: string;
    createdAt: string;
  };
  businessCount: number;
  onEdit: () => void;
}

export function ProfileHeader({ user, businessCount, onEdit }: ProfileHeaderProps) {
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'super_admin':
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'portal_investor':
      case 'investor':
        return 'bg-green-100 text-green-800';
      case 'portal_member':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'super_admin':
      case 'superadmin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'portal_investor':
      case 'investor':
        return 'Investor';
      case 'portal_member':
        return 'Portal Member';
      default:
        return role;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <div>
              <h2 className="text-2xl font-bold">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>

            {user.bio && (
              <p className="text-gray-700 max-w-2xl">{user.bio}</p>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Member since {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
              </div>

              {businessCount > 0 && (
                <div className="flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>{businessCount} {businessCount === 1 ? 'Business' : 'Businesses'}</span>
                </div>
              )}
            </div>

            <Badge className={getRoleBadgeColor(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>
          </div>
        </div>

        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>
    </Card>
  );
}