import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bug, Terminal, Database, Code, ArrowRight } from 'lucide-react';

export function DeveloperSettings() {
  const developerTools = [
    {
      title: 'Test Logging',
      description: 'Test and configure the logging system',
      icon: <Bug className="h-5 w-5" />,
      link: '/portal/admin/test-logging',
      badge: 'Debug'
    },
    {
      title: 'Test Email',
      description: 'Send test emails and verify email configuration',
      icon: <Terminal className="h-5 w-5" />,
      link: '/portal/admin/test-email',
      badge: 'Test'
    },
    {
      title: 'Edge Functions',
      description: 'Test Supabase edge functions',
      icon: <Code className="h-5 w-5" />,
      link: '/portal/admin/test-edge-function',
      badge: 'API'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Developer Tools</h3>
        <p className="text-sm text-muted-foreground">
          Testing and debugging utilities for development
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {developerTools.map((tool) => (
          <Card key={tool.title} className="relative hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tool.icon}
                  <CardTitle className="text-base">{tool.title}</CardTitle>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  {tool.badge}
                </span>
              </div>
              <CardDescription className="text-sm mt-2">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={tool.link}>
                <Button variant="outline" className="w-full group">
                  Open Tool
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900">Development Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800">
            These tools are only available in development mode and to super admins.
            They provide direct access to testing and debugging features.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Console Commands</CardTitle>
          <CardDescription>
            Useful commands you can run in the browser console
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <code className="block text-xs bg-gray-100 p-2 rounded">
            window.logging.setLevel(window.logging.LogLevel.DEBUG)
          </code>
          <code className="block text-xs bg-gray-100 p-2 rounded">
            window.logging.loggers // View all active loggers
          </code>
          <code className="block text-xs bg-gray-100 p-2 rounded">
            sessionStorage.setItem('LOG_LEVEL', 'DEBUG') // Persist log level
          </code>
        </CardContent>
      </Card>
    </div>
  );
}