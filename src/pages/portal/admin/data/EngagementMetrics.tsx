import React from 'react';
import { UnderConstruction } from '@/components/portal/admin/UnderConstruction';
import { adminRoute } from '@/lib/portal/navigation';

export function EngagementMetrics() {
  return (
    <UnderConstruction
      title="Engagement Metrics"
      description="Comprehensive user engagement scoring and analysis"
      features={[
        'Overall engagement score calculation based on multiple factors',
        'Activity heatmaps showing peak usage times and patterns',
        'User segmentation by engagement level (highly engaged, moderate, at-risk)',
        'Retention rate tracking and cohort analysis',
        'Feature adoption metrics showing which portal areas are most used',
        'Email engagement tracking (open rates, click-through rates)',
        'Comparison views across user roles and organizations',
        'Predictive analytics to identify users at risk of churning',
        'Automated engagement reports and alerts for admin team'
      ]}
      backPath={adminRoute('data/analytics')}
    />
  );
}
