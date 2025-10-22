import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  ClipboardList,
  Calendar,
  Megaphone,
  TrendingUp,
  Clock,
  Award,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Info,
  Star,
  Sparkles
} from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { portalRoute } from '@/lib/portal/navigation';
import { useFeaturedContent } from '@/hooks/useFeaturedContent';
import { stripHtml } from '@/lib/utils';

interface DashboardStats {
  totalMembers: number;
  activeSurveys: number;
  upcomingEvents: number;
  recentUpdates: number;
  referralCount: number;
  surveysCompleted: number;
  memberSince: string;
}

interface RecentActivity {
  id: string;
  type: 'survey' | 'event' | 'update' | 'referral';
  title: string;
  description: string;
  timestamp: string;
  isNew: boolean;
}

interface WelcomeMessage {
  greeting: string;
  timeOfDay: string;
}

export function PortalDashboard() {
  const { portalUser } = usePortal();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeSurveys: 0,
    upcomingEvents: 0,
    recentUpdates: 0,
    referralCount: 0,
    surveysCompleted: 0,
    memberSince: new Date().getFullYear().toString()
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [userFirstName, setUserFirstName] = useState('');
  const [primaryBusiness, setPrimaryBusiness] = useState<string | null>(null);
  const { featuredContent, loading: featuredLoading } = useFeaturedContent(true); // Skip profile completion in featured content

  useEffect(() => {
    loadDashboardData();
    loadProfileCompleteness();
  }, [portalUser]);

  const getWelcomeMessage = (): WelcomeMessage => {
    // Get Central Time (US/Central timezone)
    const centralTime = new Date().toLocaleString("en-US", {timeZone: "America/Chicago"});
    const hour = new Date(centralTime).getHours();
    let timeOfDay = 'day';
    let greeting = 'Good day';
    
    if (hour < 12) {
      timeOfDay = 'morning';
      greeting = 'Good morning';
    } else if (hour < 17) {
      timeOfDay = 'afternoon';
      greeting = 'Good afternoon';
    } else {
      timeOfDay = 'evening';
      greeting = 'Good evening';
    }
    
    return { greeting, timeOfDay };
  };

  const loadDashboardData = async () => {
    if (!portalUser) return;
    
    try {
      // Load member count - all portal users (same logic as admin users page)

      // 1. Get system admins (they automatically have portal admin access)
      const { data: systemAdmins } = await supabase
        .from('system_user_assignments')
        .select('user_id')
        .in('system_role', ['super_admin', 'admin'])
        .eq('is_active', true);

      // 2. Get explicit portal memberships
      const { data: portalMembers } = await supabase
        .from('portal_memberships')
        .select('user_id')
        .eq('is_active', true);

      // 3. Get users with portal_member role directly from profiles
      const { data: portalProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'portal_member');

      // 4. Combine and deduplicate users
      const userIdSet = new Set();

      // Add system admins
      (systemAdmins || []).forEach(admin => {
        userIdSet.add(admin.user_id);
      });

      // Add explicit portal members
      (portalMembers || []).forEach(member => {
        userIdSet.add(member.user_id);
      });

      // Add portal members from profiles table
      (portalProfiles || []).forEach(profile => {
        userIdSet.add(profile.id);
      });

      const memberCount = userIdSet.size;
      
      // Load active surveys count
      const { count: surveyCount } = await supabase
        .from('portal_surveys')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      
      // Load upcoming events count
      const { count: eventCount } = await supabase
        .from('portal_events')
        .select('*', { count: 'exact', head: true })
        .gte('start_datetime', new Date().toISOString());
      
      // Load recent updates count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: updateCount } = await supabase
        .from('portal_updates')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());
      
      // Load user's referral count
      const { count: referralCount } = await supabase
        .from('portal_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', portalUser.id);
      
      // Load user's completed surveys
      const { count: completedSurveys } = await supabase
        .from('portal_survey_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', portalUser.id)
        .eq('is_complete', true);
      
      // Get user's registration date
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', portalUser.id)
        .single();
      
      // Convert created_at to Central Time and get year
      let memberSince = new Date().getFullYear().toString();
      if (userProfile?.created_at) {
        const createdDate = new Date(userProfile.created_at);
        // Convert to Central Time
        const centralDate = new Date(createdDate.toLocaleString("en-US", {timeZone: "America/Chicago"}));
        memberSince = centralDate.getFullYear().toString();
      }
      
      setStats({
        totalMembers: memberCount || 0,
        activeSurveys: surveyCount || 0,
        upcomingEvents: eventCount || 0,
        recentUpdates: updateCount || 0,
        referralCount: referralCount || 0,
        surveysCompleted: completedSurveys || 0,
        memberSince
      });
      
      // Load recent activity
      loadRecentActivity();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    if (!portalUser) return;

    try {
      const activities: RecentActivity[] = [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Load recent updates
      const { data: updates } = await supabase
        .from('portal_updates')
        .select('id, title, content, created_at, status')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

      if (updates) {
        updates.forEach(update => {
          // Strip HTML tags and get plain text for description
          const plainText = update.content ? stripHtml(update.content) : 'New update available';
          const description = plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;

          activities.push({
            id: `update-${update.id}`,
            type: 'update',
            title: update.title,
            description: description || 'New update available',
            timestamp: update.created_at,
            isNew: new Date(update.created_at) > sevenDaysAgo
          });
        });
      }
      
      // Load recent surveys
      const { data: surveys } = await supabase
        .from('portal_surveys')
        .select('id, title, description, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(2);

      if (surveys) {
        surveys.forEach(survey => {
          // Strip HTML tags from survey description
          const plainText = survey.description ? stripHtml(survey.description) : 'New survey available';
          const description = plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;

          activities.push({
            id: `survey-${survey.id}`,
            type: 'survey',
            title: survey.title,
            description: description || 'New survey available',
            timestamp: survey.created_at,
            isNew: new Date(survey.created_at) > sevenDaysAgo
          });
        });
      }

      // Load recent events
      const { data: events } = await supabase
        .from('portal_events')
        .select('id, title, description, created_at, start_datetime')
        .gte('start_datetime', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(2);

      if (events) {
        events.forEach(event => {
          // Strip HTML tags from event description
          const plainText = event.description ? stripHtml(event.description) : 'Upcoming event';
          const description = plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;

          activities.push({
            id: `event-${event.id}`,
            type: 'event',
            title: event.title,
            description: description || 'Upcoming event',
            timestamp: event.created_at,
            isNew: new Date(event.created_at) > sevenDaysAgo
          });
        });
      }
      
      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Take only the 5 most recent activities
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error loading activity:', error);
      // Set empty array on error
      setRecentActivity([]);
    }
  };

  const loadProfileCompleteness = async () => {
    if (!portalUser) return;
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', portalUser.id)
        .single();
      
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', portalUser.id)
        .order('is_primary', { ascending: false })
        .limit(1);
      
      if (profileData) {
        // Set user's first name for welcome message
        setUserFirstName(profileData.first_name || portalUser.name?.split(' ')[0] || 'User');
        
        // Set primary business name if exists
        if (businessData && businessData.length > 0) {
          setPrimaryBusiness(businessData[0].company_name);
        }
        
        // Calculate completeness - check all relevant profile fields and business existence
        let completedItems = 0;
        const totalItems = 7; // first_name, last_name, email, phone, title, department, has_business

        // Check profile fields
        if (profileData.first_name && profileData.first_name.trim() !== '') completedItems++;
        if (profileData.last_name && profileData.last_name.trim() !== '') completedItems++;
        if (profileData.email && profileData.email.trim() !== '') completedItems++;
        if (profileData.phone && profileData.phone.trim() !== '') completedItems++;
        if (profileData.title && profileData.title.trim() !== '') completedItems++;
        if (profileData.department && profileData.department.trim() !== '') completedItems++;

        // Check if user has at least one business
        if (businessData && businessData.length > 0) completedItems++;

        const percentage = Math.round((completedItems / totalItems) * 100);
        setProfileCompleteness(percentage);
      }
    } catch (error) {
      console.error('Error loading profile completeness:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'survey':
        return <ClipboardList className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'update':
        return <Megaphone className="w-4 h-4" />;
      case 'referral':
        return <Users className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    // Convert to Central Time for consistent display
    const now = new Date();
    const then = new Date(timestamp);
    
    // Convert both to Central Time for comparison
    const nowCentral = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
    const thenCentral = new Date(then.toLocaleString("en-US", {timeZone: "America/Chicago"}));
    
    const diff = nowCentral.getTime() - thenCentral.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const { greeting } = getWelcomeMessage();

  if (loading || !portalUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-50 to-gray-50 rounded-lg p-6 border border-purple-100">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          {greeting}, {userFirstName || 'User'}!
        </h1>
        <p className="text-gray-600">
          {primaryBusiness && (
            <span className="inline-flex items-center gap-1">
              Managing: <span className="font-medium text-purple-700">{primaryBusiness}</span>
              <span className="text-gray-400">•</span>
            </span>
          )}
          Welcome to the FleetDRMS Community Portal - Your hub for staying connected
        </p>
      </div>

      {/* Solutions Showcase Featured Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Explore FleetDRMS Solutions</h2>
              </div>
              <p className="text-blue-50 mb-4">
                Discover how FleetDRMS can transform your delivery operations with our interactive showcase
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-white/20 text-white border-white/30">Interactive Demos</Badge>
                <Badge className="bg-white/20 text-white border-white/30">ROI Calculator</Badge>
                <Badge className="bg-white/20 text-white border-white/30">Guided Tours</Badge>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-6xl">🚀</div>
            </div>
          </div>
          <Button
            size="lg"
            variant="secondary"
            className="w-full md:w-auto"
            onClick={() => navigate(portalRoute('/solutions'))}
          >
            <Star className="w-4 h-4 mr-2" />
            Start Interactive Tour
          </Button>
        </CardContent>
      </Card>

      {/* Profile Completion Alert */}
      {profileCompleteness < 100 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Complete Your Profile</p>
                  <p className="text-sm text-orange-700">
                    Your profile is {profileCompleteness}% complete.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-orange-600 text-orange-600 hover:bg-orange-100"
                onClick={() => navigate(portalRoute('/profile/edit'))}
              >
                Complete Profile
              </Button>
            </div>
            <Progress value={profileCompleteness} className="mt-3 h-2" />
          </CardContent>
        </Card>
      )}

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Community Members</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-gray-500 mt-1">Active pilot owners</p>
              </div>
              <Users className="w-8 h-8 text-violet-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Surveys</p>
                <p className="text-2xl font-bold">{stats.activeSurveys}</p>
                <p className="text-xs text-gray-500 mt-1">Share your feedback</p>
              </div>
              <ClipboardList className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
                <p className="text-xs text-gray-500 mt-1">Don't miss out</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Updates</p>
                <p className="text-2xl font-bold">{stats.recentUpdates}</p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </div>
              <Megaphone className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Stay up to date with the latest community happenings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent activity to display</p>
                    <p className="text-sm mt-2">Check back later for updates!</p>
                  </div>
                ) : recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'survey' ? 'bg-blue-100' :
                      activity.type === 'event' ? 'bg-green-100' :
                      activity.type === 'update' ? 'bg-orange-100' :
                      'bg-violet-100'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{activity.title}</h4>
                        {activity.isNew && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        // Navigate to the appropriate page based on activity type
                        const activityType = activity.type;
                        // Extract ID by removing the type prefix and the first dash
                        const activityId = activity.id.substring(activity.type.length + 1); // Skip 'type-' prefix

                        if (activityType === 'update') {
                          // Updates use a modal, so just go to the updates list page
                          navigate(portalRoute(`/updates`));
                        } else if (activityType === 'survey') {
                          navigate(portalRoute(`/surveys/${activityId}`));
                        } else if (activityType === 'event') {
                          navigate(portalRoute(`/events/${activityId}`));
                        }
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {recentActivity.length > 0 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {
                    // Navigate to the most relevant page based on what's in recent activity
                    const activityTypes = recentActivity.map(a => a.type);
                    const uniqueTypes = [...new Set(activityTypes)];
                    
                    if (uniqueTypes.length === 1) {
                      // If all activities are the same type, go to that specific page
                      const singleType = uniqueTypes[0];
                      if (singleType === 'update') navigate(portalRoute('/updates'));
                      else if (singleType === 'survey') navigate(portalRoute('/surveys'));
                      else if (singleType === 'event') navigate(portalRoute('/events'));
                    } else {
                      // Mixed content - go to updates as the default "activity" page
                      navigate(portalRoute('/updates'));
                    }
                  }}
                >
                  {(() => {
                    const activityTypes = recentActivity.map(a => a.type);
                    const uniqueTypes = [...new Set(activityTypes)];
                    
                    if (uniqueTypes.length === 1) {
                      const singleType = uniqueTypes[0];
                      if (singleType === 'update') return 'View All Updates';
                      else if (singleType === 'survey') return 'View All Surveys';
                      else if (singleType === 'event') return 'View All Events';
                    }
                    return 'View All Activity';
                  })()}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Your Impact */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Impact</CardTitle>
              <CardDescription>Your contribution to the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Surveys Completed</span>
                  </div>
                  <span className="font-bold">{stats.surveysCompleted}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-600" />
                    <span className="text-sm">Referrals Made</span>
                  </div>
                  <span className="font-bold">{stats.referralCount}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Member Since</span>
                  </div>
                  <span className="font-bold">{stats.memberSince}</span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => navigate(portalRoute('/referrals'))}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Invite a Colleague
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(portalRoute('/surveys'))}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Take a Survey
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(portalRoute('/events'))}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Browse Events
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(portalRoute('/solutions'))}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                View Solutions
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(portalRoute('/contact'))}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Featured Content - Dynamic */}
      {featuredContent && (
        <Card className={`border-2 ${
          featuredContent.variant === 'important' ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' :
          featuredContent.variant === 'warning' ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' :
          featuredContent.variant === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
          featuredContent.variant === 'info' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' :
          'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <featuredContent.icon className={`w-5 h-5 ${
                featuredContent.variant === 'important' ? 'text-red-600' :
                featuredContent.variant === 'warning' ? 'text-amber-600' :
                featuredContent.variant === 'success' ? 'text-green-600' :
                featuredContent.variant === 'info' ? 'text-blue-600' :
                'text-violet-600'
              }`} />
              <h3 className="font-semibold text-lg">{featuredContent.title}</h3>
              {featuredContent.type === 'urgent_survey' && (
                <Badge variant="destructive" className="ml-auto">Urgent</Badge>
              )}
              {featuredContent.type === 'upcoming_event' && (
                <Badge variant="secondary" className="ml-auto">Reminder</Badge>
              )}
              {featuredContent.type === 'new_survey' && (
                <Badge className="ml-auto bg-violet-100 text-violet-700">New</Badge>
              )}
              {featuredContent.type === 'new_event' && (
                <Badge className="ml-auto bg-green-100 text-green-700">New</Badge>
              )}
            </div>

            <p className="text-gray-700 mb-4">
              {featuredContent.description}
            </p>

            {/* Show progress bar if available */}
            {featuredContent.progress !== undefined && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{featuredContent.progress}%</span>
                </div>
                <Progress value={featuredContent.progress} className="h-2" />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className={
                  featuredContent.variant === 'important' ? 'bg-red-600 hover:bg-red-700' :
                  featuredContent.variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                  featuredContent.variant === 'success' ? 'bg-green-600 hover:bg-green-700' :
                  featuredContent.variant === 'info' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-purple-600 hover:bg-purple-700'
                }
                onClick={() => navigate(featuredContent.primaryLink)}
              >
                {featuredContent.primaryAction}
              </Button>

              {featuredContent.secondaryAction && featuredContent.secondaryLink && (
                <Button
                  variant="outline"
                  onClick={() => navigate(featuredContent.secondaryLink!)}
                >
                  {featuredContent.secondaryAction}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}