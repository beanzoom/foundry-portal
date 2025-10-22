import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Play, Pause, Trash2, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface QueueItem {
  id: string
  event_type: string
  event_id: string | null
  to_email: string
  status: string
  priority: number
  attempts: number
  max_attempts: number
  scheduled_for: string
  created_at: string
  last_error: string | null
  template?: {
    name: string
  }
}

interface QueueStats {
  total: number
  queued: number
  processing: number
  sent: number
  failed: number
}

export default function EmailQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    queued: 0,
    processing: 0,
    sent: 0,
    failed: 0
  })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('queued')

  useEffect(() => {
    loadQueue()
    const interval = setInterval(loadQueue, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [activeTab])

  const loadQueue = async () => {
    try {
      // Get queue items based on active tab
      const query = supabase
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (activeTab !== 'all') {
        query.eq('status', activeTab)
      }

      const { data: queueData, error } = await query

      if (error) throw error

      // Fetch template names separately if needed
      const queueWithTemplates = queueData || []
      if (queueWithTemplates.length > 0) {
        const templateIds = [...new Set(queueWithTemplates.map(q => q.template_id).filter(Boolean))]
        if (templateIds.length > 0) {
          const { data: templates } = await supabase
            .from('email_templates')
            .select('id, name')
            .in('id', templateIds)

          if (templates) {
            const templateMap = new Map(templates.map(t => [t.id, t]))
            queueWithTemplates.forEach(item => {
              if (item.template_id) {
                item.template = templateMap.get(item.template_id)
              }
            })
          }
        }
      }

      setQueue(queueWithTemplates)

      // Get stats
      const { data: statsData, error: statsError } = await supabase
        .from('email_queue_status')
        .select('*')

      if (!statsError && statsData) {
        const newStats: QueueStats = {
          total: 0,
          queued: 0,
          processing: 0,
          sent: 0,
          failed: 0
        }

        statsData.forEach(row => {
          newStats.total += row.count
          newStats[row.status as keyof QueueStats] = row.count
        })

        setStats(newStats)
      }
    } catch (error) {
      console.error('Error loading queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const processQueue = async () => {
    setProcessing(true)
    try {
      const { data, error } = await supabase.functions.invoke('process-email-queue', {
        body: { batchSize: 10 }
      })

      if (error) throw error

      await loadQueue()

      // Show success message
      alert(`Processed ${data.processed} emails. Sent: ${data.sent}, Failed: ${data.failed}`)
    } catch (error) {
      console.error('Error processing queue:', error)
      alert('Failed to process email queue')
    } finally {
      setProcessing(false)
    }
  }

  const retryEmail = async (queueId: string) => {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({
          status: 'pending',
          attempts: 0,
          last_error: null,
          scheduled_for: new Date().toISOString()
        })
        .eq('id', queueId)

      if (error) throw error

      await loadQueue()
    } catch (error) {
      console.error('Error retrying email:', error)
    }
  }

  const cancelEmail = async (queueId: string) => {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({ status: 'cancelled' })
        .eq('id', queueId)

      if (error) throw error

      await loadQueue()
    } catch (error) {
      console.error('Error cancelling email:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      queued: { variant: 'secondary', icon: Clock },
      pending: { variant: 'secondary', icon: Clock },
      processing: { variant: 'default', icon: RefreshCw },
      sent: { variant: 'success', icon: CheckCircle },
      failed: { variant: 'destructive', icon: XCircle },
      cancelled: { variant: 'outline', icon: XCircle }
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: number) => {
    let variant: any = 'outline'
    let label = 'Normal'

    if (priority <= 3) {
      variant = 'destructive'
      label = 'High'
    } else if (priority <= 5) {
      variant = 'default'
      label = 'Normal'
    } else {
      variant = 'secondary'
      label = 'Low'
    }

    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Email Queue</h2>
          <p className="text-muted-foreground">Monitor and manage the email queue</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadQueue} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={processQueue} disabled={processing} size="sm">
            <Play className="h-4 w-4 mr-2" />
            Process Queue
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Queued</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.queued}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.processing}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sent</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.sent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="queued">Queued</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="text-center py-4">Loading queue...</div>
              ) : queue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No emails in queue
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queue.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.to_email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.event_type.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.template?.name || 'No template'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(item.priority)}
                        </TableCell>
                        <TableCell>
                          {item.attempts}/{item.max_attempts}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(item.scheduled_for), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {item.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => retryEmail(item.id)}
                                title="Retry"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            {(item.status === 'queued' || item.status === 'pending' || item.status === 'processing') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelEmail(item.id)}
                                title="Cancel"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>

          {queue.some(q => q.last_error) && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Some emails have errors. Click on them to see details.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}