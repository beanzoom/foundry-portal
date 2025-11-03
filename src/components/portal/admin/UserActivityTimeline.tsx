import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ActivityEvent,
  getActivityTypeInfo,
  getActivityStatusInfo
} from '@/services/user-activity.service';
import { ChevronRight, ExternalLink } from 'lucide-react';

interface UserActivityTimelineProps {
  activities: ActivityEvent[];
  onActivityClick?: (activity: ActivityEvent) => void;
  showDate?: boolean;
}

export function UserActivityTimeline({
  activities,
  onActivityClick,
  showDate = true
}: UserActivityTimelineProps) {

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 mb-2 text-4xl">📊</div>
          <p className="text-gray-500">No activity recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  // Group activities by date if showDate is true
  const groupedActivities = showDate ? groupByDate(activities) : { 'All Activity': activities };

  return (
    <div className="space-y-6">
      {Object.entries(groupedActivities).map(([dateLabel, dateActivities]) => (
        <div key={dateLabel}>
          {showDate && (
            <div className="sticky top-0 bg-gray-50 py-2 mb-3 border-b">
              <h3 className="text-sm font-semibold text-gray-700">{dateLabel}</h3>
            </div>
          )}

          <div className="space-y-3">
            {dateActivities.map((activity) => {
              const typeInfo = getActivityTypeInfo(activity.type);
              const statusInfo = activity.status ? getActivityStatusInfo(activity.status) : null;

              return (
                <Card
                  key={activity.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onActivityClick?.(activity)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${typeInfo.color} flex items-center justify-center text-xl`}>
                        {typeInfo.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={typeInfo.color}>
                                {typeInfo.label}
                              </Badge>
                              {statusInfo && (
                                <Badge variant="outline" className={statusInfo.color}>
                                  {statusInfo.label}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              {activity.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {activity.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <time dateTime={activity.timestamp}>
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </time>
                            {onActivityClick && (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Metadata display for certain activity types */}
                        {activity.type === 'calculator' && activity.metadata?.total_annual_savings && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Annual Savings:</span>{' '}
                            ${Number(activity.metadata.total_annual_savings).toLocaleString()}
                          </div>
                        )}

                        {activity.type === 'event' && activity.metadata?.check_in_time && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Check-in:</span>{' '}
                            {format(new Date(activity.metadata.check_in_time), 'PPp')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Group activities by date for timeline display
 */
function groupByDate(activities: ActivityEvent[]): Record<string, ActivityEvent[]> {
  const groups: Record<string, ActivityEvent[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  activities.forEach(activity => {
    const activityDate = new Date(activity.timestamp);
    let dateLabel: string;

    if (isSameDay(activityDate, today)) {
      dateLabel = 'Today';
    } else if (isSameDay(activityDate, yesterday)) {
      dateLabel = 'Yesterday';
    } else if (isWithinDays(activityDate, today, 7)) {
      dateLabel = format(activityDate, 'EEEE'); // Day name (e.g., "Monday")
    } else if (activityDate.getFullYear() === today.getFullYear()) {
      dateLabel = format(activityDate, 'MMMM d'); // e.g., "January 15"
    } else {
      dateLabel = format(activityDate, 'MMMM d, yyyy'); // e.g., "January 15, 2024"
    }

    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(activity);
  });

  return groups;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function isWithinDays(date: Date, referenceDate: Date, days: number): boolean {
  const diffTime = referenceDate.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < days;
}
