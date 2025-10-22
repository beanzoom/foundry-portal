import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { createLogger, LogLevel, setGlobalLogLevel } from '@/lib/logging';

const logger = createLogger('TestLogging');

export function TestLogging() {
  const [currentLevel, setCurrentLevel] = useState<LogLevel>(logger.getLevel());

  useEffect(() => {
    logger.info('TestLogging component mounted');
    console.log('[TestLogging] Component rendered successfully');
  }, []);

  const testAllLevels = () => {
    logger.debug('This is a DEBUG message - detailed information');
    logger.info('This is an INFO message - general information');
    logger.warn('This is a WARN message - something to watch out for');
    logger.error('This is an ERROR message - something went wrong', { errorCode: 500 });
  };

  const testGrouping = () => {
    logger.group('Test Group');
    logger.debug('Message inside group 1');
    logger.debug('Message inside group 2');
    logger.debug('Message inside group 3');
    logger.groupEnd();
  };

  const testPerformance = () => {
    logger.time('Performance Test');

    // Simulate some work
    setTimeout(() => {
      logger.timeEnd('Performance Test');
    }, 1000);
  };

  const testTable = () => {
    const data = [
      { name: 'John', age: 30, role: 'admin' },
      { name: 'Jane', age: 25, role: 'user' },
      { name: 'Bob', age: 35, role: 'investor' }
    ];
    logger.table(data);
  };

  const changeLogLevel = (level: LogLevel) => {
    setGlobalLogLevel(level);
    setCurrentLevel(level);
    logger.info(`Log level changed to: ${LogLevel[level]}`);
  };

  const testMultipleLoggers = () => {
    const logger1 = createLogger('Component1');
    const logger2 = createLogger('Component2');
    const logger3 = createLogger('Component3');

    logger1.debug('Debug from Component1');
    logger2.info('Info from Component2');
    logger3.warn('Warning from Component3');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/portal/admin/settings/developer"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Developer Settings
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logging System Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Current Log Level: <strong>{LogLevel[currentLevel]}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Open browser console (F12) to see log output
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Button
              onClick={() => changeLogLevel(LogLevel.DEBUG)}
              variant={currentLevel === LogLevel.DEBUG ? 'default' : 'outline'}
              size="sm"
            >
              DEBUG
            </Button>
            <Button
              onClick={() => changeLogLevel(LogLevel.INFO)}
              variant={currentLevel === LogLevel.INFO ? 'default' : 'outline'}
              size="sm"
            >
              INFO
            </Button>
            <Button
              onClick={() => changeLogLevel(LogLevel.WARN)}
              variant={currentLevel === LogLevel.WARN ? 'default' : 'outline'}
              size="sm"
            >
              WARN
            </Button>
            <Button
              onClick={() => changeLogLevel(LogLevel.ERROR)}
              variant={currentLevel === LogLevel.ERROR ? 'default' : 'outline'}
              size="sm"
            >
              ERROR
            </Button>
            <Button
              onClick={() => changeLogLevel(LogLevel.NONE)}
              variant={currentLevel === LogLevel.NONE ? 'default' : 'outline'}
              size="sm"
            >
              NONE
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Test Functions</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button onClick={testAllLevels} variant="outline">
                Test All Log Levels
              </Button>

              <Button onClick={testGrouping} variant="outline">
                Test Grouping
              </Button>

              <Button onClick={testPerformance} variant="outline">
                Test Performance Timer
              </Button>

              <Button onClick={testTable} variant="outline">
                Test Table Output
              </Button>

              <Button onClick={testMultipleLoggers} variant="outline">
                Test Multiple Loggers
              </Button>

              <Button
                onClick={() => {
                  try {
                    throw new Error('Test error for logging');
                  } catch (error) {
                    logger.error('Caught an error:', error);
                  }
                }}
                variant="outline"
                className="border-red-500"
              >
                Test Error Handling
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Expected Behaviors:</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>DEBUG level:</strong> Shows all messages</li>
              <li>• <strong>INFO level:</strong> Hides DEBUG messages</li>
              <li>• <strong>WARN level:</strong> Only shows WARN and ERROR</li>
              <li>• <strong>ERROR level:</strong> Only shows ERROR messages</li>
              <li>• <strong>NONE level:</strong> No output at all</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Console Commands:</h4>
            <code className="text-xs block space-y-1">
              <div>window.logging.loggers // See all loggers</div>
              <div>window.logging.setLevel(window.logging.LogLevel.DEBUG)</div>
              <div>sessionStorage.setItem('LOG_LEVEL', 'DEBUG') // Persist</div>
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TestLogging;