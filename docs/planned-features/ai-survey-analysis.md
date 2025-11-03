# AI Survey Analysis Feature

**Status:** 🟢 Ready to Build
**Priority:** High
**Estimated Effort:** 1-2 weeks (MVP), 3-4 weeks (Full Feature)
**Dependencies:** Survey Analytics page (✅ Completed)
**Last Updated:** 2025-01-03

---

## Table of Contents

1. [Overview](#overview)
2. [User Stories](#user-stories)
3. [Business Value](#business-value)
4. [Technical Requirements](#technical-requirements)
5. [Architecture Options](#architecture-options)
6. [Recommended Approach](#recommended-approach)
7. [Implementation Plan](#implementation-plan)
8. [Database Schema](#database-schema)
9. [API Specification](#api-specification)
10. [UI/UX Design](#uiux-design)
11. [AI Integration](#ai-integration)
12. [Cost Analysis](#cost-analysis)
13. [Success Metrics](#success-metrics)
14. [Testing Strategy](#testing-strategy)
15. [Security & Privacy](#security--privacy)
16. [Risks & Mitigation](#risks--mitigation)

---

## Overview

### What It Does

The AI Survey Analysis feature uses artificial intelligence (Claude by Anthropic) to automatically analyze survey responses and generate comprehensive summaries, insights, and actionable recommendations for portal administrators.

### Why It's Needed

**Current State:**
- Admins manually review individual survey responses
- Time-consuming to identify patterns across 50+ responses
- Difficult to extract actionable insights from open-ended questions
- No sentiment analysis or theme identification

**Future State:**
- AI automatically analyzes all responses in seconds
- Identifies key themes, sentiment, and patterns
- Provides actionable recommendations
- Saves hours of manual analysis time
- Reveals insights that might be missed manually

### Example Use Case

**Survey:** Portal Feedback Survey (5 questions, 50 responses)

**Manual Process (Current):**
- Read 50 responses × 5 questions = 250 individual answers
- Take notes on common themes
- Try to gauge overall sentiment
- Make recommendations
- **Time:** 2-3 hours

**AI Process (Planned):**
- Click "Analyze Survey" button
- AI reads all 250 answers in 20 seconds
- Generates summary with themes, sentiment, quotes
- Provides prioritized action items
- **Time:** 30 seconds

---

## User Stories

### As a Portal Admin
- I want to quickly understand what users are saying in surveys
- So that I can make data-driven decisions about portal improvements

### As a Product Manager
- I want to see sentiment trends over time
- So that I can measure if our changes are positively received

### As an Executive
- I want high-level summaries of user feedback
- So that I can understand user satisfaction without reading every response

### As a Development Team
- I want to know which features users request most
- So that we can prioritize our roadmap based on real user needs

---

## Business Value

### Quantifiable Benefits

1. **Time Savings**
   - Manual analysis: 2-3 hours per survey
   - AI analysis: 30 seconds
   - **Savings: ~2.5 hours per survey**
   - With 4 surveys/month: **10 hours/month saved**

2. **Cost Reduction**
   - Admin time saved: 10 hours × $50/hour = **$500/month**
   - AI API costs: **$5/month**
   - **Net savings: $495/month = $5,940/year**

3. **Better Insights**
   - Identifies themes humans might miss
   - Consistent analysis methodology
   - No bias or fatigue effects
   - Can analyze 100s of responses equally well

4. **Faster Decision Making**
   - Insights available immediately after survey closes
   - Can act on feedback within days instead of weeks
   - Competitive advantage through rapid iteration

### Qualitative Benefits

- **Improved User Satisfaction** - Faster response to feedback
- **Data-Driven Culture** - Decisions backed by AI insights
- **Professional Reporting** - Share AI summaries with stakeholders
- **Trend Identification** - Spot patterns across multiple surveys

---

## Technical Requirements

### Functional Requirements

1. **Survey Analysis**
   - Analyze all responses for a given survey
   - Support multiple question types (text, multiple choice, rating)
   - Generate summary within 30 seconds for 50 responses
   - Handle surveys with 1-1000 responses

2. **Analysis Types**
   - Question-by-question summary
   - Overall sentiment analysis (positive/neutral/negative)
   - Key theme extraction
   - Actionable recommendations
   - Frequency analysis (most common responses)

3. **Caching & Storage**
   - Store analysis results in database
   - Display cached results instantly
   - Option to re-analyze with fresh data
   - Track analysis history

4. **User Interface**
   - "Analyze" button on Survey Analytics page
   - Loading state during analysis
   - Formatted display of results
   - Export analysis as PDF (future)

### Non-Functional Requirements

1. **Performance**
   - Analysis completes within 30 seconds for 50 responses
   - Cached results load in <1 second
   - No impact on existing page load times

2. **Reliability**
   - 99% success rate for API calls
   - Graceful error handling (retry logic)
   - Fallback if AI service unavailable

3. **Security**
   - Admin-only access
   - No PII exposed to AI (anonymize if needed)
   - Secure API key storage
   - Audit log of who ran analysis

4. **Scalability**
   - Support 1000+ response surveys
   - Handle concurrent analysis requests
   - Rate limiting to prevent abuse

5. **Cost Management**
   - Budget cap ($100/month)
   - Alert if costs exceed threshold
   - Optimize token usage

---

## Architecture Options

### Option 1: Real-Time Analysis (On-Demand)

**Flow:**
```
User clicks "Analyze"
  → Frontend calls Edge Function
  → Edge Function calls Claude API
  → Claude analyzes responses (~20 sec)
  → Results returned to frontend
  → Display immediately
```

**Pros:**
- ✅ Always current (analyzes latest responses)
- ✅ No storage needed for results
- ✅ Simple implementation
- ✅ Can re-analyze with different prompts

**Cons:**
- ❌ Slower UX (wait 20-30 seconds)
- ❌ Higher costs (pay per analysis)
- ❌ Rate limits from AI provider
- ❌ No analysis history

**Best For:** MVP, low survey volume (<10 analyses/month)

---

### Option 2: Cached Analysis (Database Storage)

**Flow:**
```
User clicks "Analyze"
  → Check cache in database
  → If cached & recent: return immediately
  → If not: run analysis
  → Store result in database
  → Display result
```

**Pros:**
- ✅ Instant display for cached results (<1 sec)
- ✅ Lower costs (only analyze when changed)
- ✅ Analysis history tracking
- ✅ Can compare over time

**Cons:**
- ❌ More complex (caching logic)
- ❌ Potentially stale data
- ❌ Storage costs (minimal)
- ❌ Need cache invalidation strategy

**Best For:** Production, moderate survey volume (10-50 analyses/month)

---

### Option 3: Hybrid (Recommended)

**Flow:**
```
Page loads
  → Show cached analysis if available
  → Display "Last analyzed: 2 hours ago"
  → "Re-analyze" button available

User clicks "Re-analyze"
  → Run fresh analysis
  → Update cache
  → Display new results
```

**Pros:**
- ✅ Best UX (instant + fresh option)
- ✅ Cost-effective (cache prevents waste)
- ✅ Always have latest data option
- ✅ History tracking

**Cons:**
- ❌ More complex than Option 1
- ❌ Requires both caching and API integration

**Best For:** Production with high survey volume (50+ analyses/month)

**Why Recommended:**
- Balances speed, cost, and flexibility
- Professional UX (shows when data was analyzed)
- Prevents redundant analyses
- Scales well

---

### Option 4: Background Queue Processing

**Flow:**
```
Survey closes
  → Trigger analysis job
  → Job added to queue
  → Worker picks up job
  → Analysis runs in background
  → Email admin when complete
  → Results available next time they visit
```

**Pros:**
- ✅ No waiting for users
- ✅ Can batch process
- ✅ Handles large surveys (1000+ responses)
- ✅ No UI blocking

**Cons:**
- ❌ Most complex to implement
- ❌ Need job queue infrastructure
- ❌ Not immediate feedback
- ❌ Requires notification system

**Best For:** Enterprise scale, very large surveys

---

## Recommended Approach

**Use Option 3: Hybrid Approach**

### Why This Choice?

1. **User Experience**
   - First visit: See cached analysis instantly
   - Shows "Analyzed 2 hours ago" for transparency
   - "Re-analyze" button for fresh data when needed
   - No forced waiting unless user wants latest data

2. **Cost Efficiency**
   - Only re-analyze when responses change significantly
   - Prevent duplicate analyses of same data
   - ~75% cost reduction vs. Option 1

3. **Scalability**
   - Cache handles high traffic
   - API only called when needed
   - Easy to add more analysis types later

4. **Professional Feel**
   - Shows when data was last processed
   - Gives control to admin
   - Analysis history for trends

### Implementation Phases

**Phase 1: MVP (Week 1)**
- Basic real-time analysis (Option 1)
- Single "Analyze" button
- Display key themes + sentiment
- No caching

**Phase 2: Caching (Week 2)**
- Add database table
- Store analysis results
- Show cached by default
- Add "Re-analyze" button

**Phase 3: Enhanced (Weeks 3-4)**
- Multiple analysis types
- Export to PDF
- Comparison views
- Historical trends

---

## Implementation Plan

### Phase 1: MVP (1 week)

**Goal:** Basic AI analysis working end-to-end

**Tasks:**
1. **Backend - Supabase Edge Function** (2 days)
   ```typescript
   // File: supabase/functions/analyze-survey/index.ts

   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
   import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.9.0'

   serve(async (req) => {
     const { surveyId } = await req.json()

     // 1. Fetch survey responses from DB
     const supabase = createClient(...)
     const { data: responses } = await supabase
       .from('portal_survey_responses')
       .select('*, portal_survey_answers(*)')
       .eq('survey_id', surveyId)

     // 2. Format for Claude
     const prompt = buildAnalysisPrompt(responses)

     // 3. Call Claude API
     const anthropic = new Anthropic({
       apiKey: Deno.env.get('ANTHROPIC_API_KEY')
     })

     const message = await anthropic.messages.create({
       model: "claude-3-5-sonnet-20241022",
       max_tokens: 4096,
       messages: [{ role: "user", content: prompt }]
     })

     // 4. Return analysis
     return new Response(JSON.stringify({
       analysis: message.content[0].text
     }))
   })
   ```

2. **Frontend - Analysis Component** (2 days)
   ```typescript
   // File: src/components/portal/admin/SurveyAnalysisPanel.tsx

   export function SurveyAnalysisPanel({ surveyId }: Props) {
     const [analysis, setAnalysis] = useState<string | null>(null)
     const [analyzing, setAnalyzing] = useState(false)

     const runAnalysis = async () => {
       setAnalyzing(true)
       try {
         const result = await supabase.functions.invoke('analyze-survey', {
           body: { surveyId }
         })
         setAnalysis(result.data.analysis)
       } finally {
         setAnalyzing(false)
       }
     }

     return (
       <Card>
         <CardHeader>
           <CardTitle>AI Analysis</CardTitle>
         </CardHeader>
         <CardContent>
           {!analysis && (
             <Button onClick={runAnalysis} disabled={analyzing}>
               {analyzing ? 'Analyzing...' : 'Analyze Survey'}
             </Button>
           )}
           {analysis && (
             <MarkdownDisplay content={analysis} />
           )}
         </CardContent>
       </Card>
     )
   }
   ```

3. **UI Integration** (1 day)
   - Add component to Survey Analytics page
   - Style loading states
   - Format analysis output

4. **Testing** (1 day)
   - Test with Portal Feedback Survey
   - Verify analysis quality
   - Check error handling

**Deliverables:**
- ✅ Working "Analyze" button
- ✅ AI-generated summary displays
- ✅ Basic error handling
- ✅ Cost tracking

---

### Phase 2: Caching (1 week)

**Goal:** Store and reuse analysis results

**Tasks:**
1. **Database Schema** (1 day)
   ```sql
   CREATE TABLE survey_analysis (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     survey_id UUID REFERENCES portal_surveys(id) ON DELETE CASCADE,
     analysis_type TEXT DEFAULT 'full',
     analysis_result JSONB NOT NULL,
     response_count INTEGER,
     analyzed_at TIMESTAMPTZ DEFAULT NOW(),
     analyzed_by UUID REFERENCES profiles(id),
     model_used TEXT,
     tokens_used INTEGER,
     cost_usd NUMERIC(10,4),

     UNIQUE(survey_id, analysis_type)
   );

   CREATE INDEX idx_survey_analysis_survey ON survey_analysis(survey_id);
   ```

2. **Service Layer** (2 days)
   ```typescript
   // src/services/survey-ai-analysis.service.ts

   export async function getAnalysis(surveyId: string) {
     // Check cache first
     const cached = await getCachedAnalysis(surveyId)
     if (cached && isFresh(cached)) {
       return { ...cached, fromCache: true }
     }

     // Run new analysis
     const analysis = await runAnalysis(surveyId)

     // Store in cache
     await saveAnalysis(surveyId, analysis)

     return { ...analysis, fromCache: false }
   }

   function isFresh(cached: Analysis): boolean {
     const hoursSince = (Date.now() - new Date(cached.analyzed_at).getTime()) / (1000 * 60 * 60)
     return hoursSince < 24 // Fresh if < 24 hours old
   }
   ```

3. **UI Updates** (2 days)
   - Show "Last analyzed: X ago"
   - Add "Re-analyze" button
   - Display cache indicator
   - Show cost/token info for admins

4. **Testing** (1 day)
   - Verify caching logic
   - Test re-analysis
   - Check database storage

**Deliverables:**
- ✅ Analysis results cached in DB
- ✅ Instant display of cached results
- ✅ Re-analyze functionality
- ✅ Timestamp display

---

### Phase 3: Enhanced Features (2 weeks)

**Goal:** Advanced analysis capabilities

**Tasks:**

1. **Structured Analysis Types** (3 days)
   ```typescript
   interface StructuredAnalysis {
     summary: string
     key_themes: Array<{
       theme: string
       frequency: number
       sentiment: 'positive' | 'neutral' | 'negative'
       example_quotes: string[]
     }>
     question_insights: Array<{
       question_id: string
       question_text: string
       response_count: number
       top_responses: string[]
       sentiment_breakdown: {
         positive: number
         neutral: number
         negative: number
       }
       recommendations: string[]
     }>
     overall_sentiment: {
       score: number // -1 to 1
       label: string // 'Very Positive', 'Positive', etc.
       distribution: { positive: number, neutral: number, negative: number }
     }
     action_items: Array<{
       priority: 'high' | 'medium' | 'low'
       category: string
       description: string
       user_count: number
     }>
     notable_quotes: string[]
   }
   ```

2. **Visual Displays** (3 days)
   - Theme cards with frequency bars
   - Sentiment gauge charts
   - Action items list with priority tags
   - Notable quotes carousel

3. **Comparison Features** (3 days)
   - Compare with previous survey
   - Trend analysis over time
   - Delta indicators (↑ 15% positive sentiment)

4. **Export Functionality** (2 days)
   - Export as PDF
   - Include charts and quotes
   - Branded template

5. **Testing & Polish** (3 days)
   - Comprehensive testing
   - UI refinements
   - Performance optimization

**Deliverables:**
- ✅ Rich structured analysis
- ✅ Visual charts and graphs
- ✅ Comparison views
- ✅ PDF export

---

### Phase 4: Advanced (Optional)

**Goal:** Cutting-edge features

**Features:**
- Streaming responses (show AI "typing")
- Custom analysis prompts
- AI chat interface ("Ask about this survey")
- Scheduled auto-analysis
- Email reports
- Multi-survey comparative analysis

---

## Database Schema

### survey_analysis Table

```sql
CREATE TABLE survey_analysis (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  survey_id UUID NOT NULL REFERENCES portal_surveys(id) ON DELETE CASCADE,
  analyzed_by UUID REFERENCES profiles(id), -- Admin who triggered analysis

  -- Analysis Data
  analysis_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'sentiment', 'themes', 'trends'
  analysis_result JSONB NOT NULL, -- Structured analysis data
  analysis_version TEXT, -- Track prompt/schema versions

  -- Metadata
  response_count INTEGER NOT NULL, -- How many responses were analyzed
  model_used TEXT NOT NULL, -- e.g., 'claude-3-5-sonnet-20241022'
  tokens_used INTEGER, -- Total tokens (input + output)
  cost_usd NUMERIC(10,4), -- Cost of this analysis

  -- Timestamps
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_survey_analysis_type UNIQUE(survey_id, analysis_type),
  CONSTRAINT positive_response_count CHECK (response_count > 0),
  CONSTRAINT positive_tokens CHECK (tokens_used > 0),
  CONSTRAINT positive_cost CHECK (cost_usd >= 0)
);

-- Indexes
CREATE INDEX idx_survey_analysis_survey_id ON survey_analysis(survey_id);
CREATE INDEX idx_survey_analysis_analyzed_at ON survey_analysis(analyzed_at DESC);
CREATE INDEX idx_survey_analysis_type ON survey_analysis(analysis_type);

-- RLS Policies
ALTER TABLE survey_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all analyses"
  ON survey_analysis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'system_admin')
    )
  );

CREATE POLICY "Admins can insert analyses"
  ON survey_analysis FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'system_admin')
    )
  );
```

### analysis_result JSONB Structure

```typescript
{
  // Version 1 schema
  "schema_version": "1.0",

  // Executive Summary
  "summary": "Users are highly satisfied with the portal (78% positive sentiment)...",

  // Key Themes
  "key_themes": [
    {
      "theme": "Mobile Access",
      "frequency": 34,
      "percentage": 67,
      "sentiment": "positive",
      "example_quotes": [
        "Would love a mobile app for on-the-go access",
        "Mobile version is essential for drivers"
      ]
    }
  ],

  // Question-by-Question Insights
  "question_insights": [
    {
      "question_id": "uuid-here",
      "question_text": "What features would you like to see?",
      "question_type": "long_text",
      "response_count": 50,
      "top_responses": [
        "Mobile app (34 mentions)",
        "Email notifications (23 mentions)",
        "Dark mode (12 mentions)"
      ],
      "sentiment_breakdown": {
        "positive": 39,
        "neutral": 8,
        "negative": 3
      },
      "recommendations": [
        "Prioritize mobile app development (67% of users)",
        "Implement email notifications as quick win"
      ]
    }
  ],

  // Overall Sentiment
  "overall_sentiment": {
    "score": 0.78, // -1 to 1
    "label": "Positive",
    "distribution": {
      "positive": 78,
      "neutral": 15,
      "negative": 7
    }
  },

  // Actionable Items
  "action_items": [
    {
      "priority": "high",
      "category": "Feature Request",
      "description": "Develop mobile application",
      "user_count": 34,
      "urgency_score": 0.9
    }
  ],

  // Notable Quotes
  "notable_quotes": [
    {
      "quote": "This portal has transformed how we communicate with drivers",
      "sentiment": "positive",
      "context": "Overall experience question"
    }
  ],

  // Metadata
  "generated_at": "2025-01-03T10:30:00Z",
  "model": "claude-3-5-sonnet-20241022",
  "prompt_version": "1.0"
}
```

---

## API Specification

### Edge Function: analyze-survey

**Endpoint:** `POST /functions/v1/analyze-survey`

**Request:**
```typescript
{
  surveyId: string; // UUID of survey to analyze
  analysisType?: 'full' | 'sentiment' | 'themes' | 'trends'; // Default: 'full'
  forceRefresh?: boolean; // Ignore cache, run fresh analysis
}
```

**Response (Success):**
```typescript
{
  success: true,
  data: {
    analysisId: string,
    surveyId: string,
    analysis: StructuredAnalysis, // See JSONB structure above
    metadata: {
      responseCount: number,
      modelUsed: string,
      tokensUsed: number,
      costUsd: number,
      analyzedAt: string,
      fromCache: boolean
    }
  }
}
```

**Response (Error):**
```typescript
{
  success: false,
  error: {
    code: string, // 'RATE_LIMIT' | 'API_ERROR' | 'NO_RESPONSES' | 'UNAUTHORIZED'
    message: string,
    details?: any
  }
}
```

**Error Codes:**

| Code | HTTP Status | Description | Retry? |
|------|-------------|-------------|--------|
| `UNAUTHORIZED` | 401 | User not admin | No |
| `NO_RESPONSES` | 400 | Survey has no responses | No |
| `RATE_LIMIT` | 429 | Too many requests | Yes (exponential backoff) |
| `API_ERROR` | 502 | Claude API error | Yes (max 3 retries) |
| `INVALID_SURVEY` | 404 | Survey not found | No |
| `COST_LIMIT` | 402 | Monthly budget exceeded | No |

**Rate Limits:**
- 10 analyses per minute per user
- 100 analyses per day per user
- 1000 analyses per month organization-wide

---

## UI/UX Design

### Survey Analytics Page - Analysis Section

```
┌─────────────────────────────────────────────────────────────────┐
│ Survey Analytics > Portal Feedback Survey                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ [← Back to Surveys]                                              │
│                                                                   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Portal Feedback Survey                     [published]     │   │
│ ├───────────────────────────────────────────────────────────┤   │
│ │  50 Responses | 48 Completed | 2 In Progress | 96%        │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ 🤖 AI Analysis                   Last analyzed: 2 hours ago│   │
│ │                                              [Re-analyze]   │   │
│ ├───────────────────────────────────────────────────────────┤   │
│ │                                                             │   │
│ │ 📊 Summary                                                  │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│ │ Users are highly satisfied with the portal (78% positive    │   │
│ │ sentiment). The most requested feature is a mobile app      │   │
│ │ (67% of respondents). Performance is generally praised,     │   │
│ │ though 12 users mentioned occasional lag.                   │   │
│ │                                                             │   │
│ │ 😊 Overall Sentiment: 78% Positive                          │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│ │ [████████████████████▓▓▓░░] 78% Positive | 15% Neutral | 7% Negative│
│ │                                                             │   │
│ │ 🎯 Key Themes                                               │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│ │ 📱 Mobile Access                          34 mentions (67%) │   │
│ │    "Would love a mobile app for on-the-go access"          │   │
│ │                                                             │   │
│ │ 🔔 Notifications                          23 mentions (45%) │   │
│ │    "Email notifications would be helpful"                   │   │
│ │                                                             │   │
│ │ 🌙 Dark Mode                              12 mentions (23%) │   │
│ │    "Dark mode would be nice for night shifts"               │   │
│ │                                                             │   │
│ │ ⚡ Quick Wins                                                │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│ │ ✅ Add email notifications (simple, high request)           │   │
│ │ ✅ Implement dark mode toggle (low effort, 23% want)        │   │
│ │ ✅ Optimize page load times (12 users mentioned lag)        │   │
│ │                                                             │   │
│ │ 🎯 Priority Actions                                         │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│ │ 🔴 HIGH: Develop mobile app (67% of users requesting)       │   │
│ │ 🟡 MEDIUM: Add email notifications (45% want this)          │   │
│ │ 🟢 LOW: Investigate lag issues (12 reports)                 │   │
│ │                                                             │   │
│ │ 💬 Notable Quotes                                           │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│ │ "This portal has transformed how we communicate with        │   │
│ │  drivers. Night and day difference!"                        │   │
│ │                                            - User #23 😊     │   │
│ │                                                             │   │
│ │ [View Full Analysis] [Export PDF] [Share]                  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│ [Response Table Below...]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌───────────────────────────────────────────────────────────┐
│ 🤖 AI Analysis                                            │
├───────────────────────────────────────────────────────────┤
│                                                           │
│           [⚡ Analyzing Survey Responses...]              │
│                                                           │
│           ████████████░░░░░░░░░░░░ 60%                   │
│                                                           │
│           Reading 50 responses...                         │
│           Identifying themes...                           │
│           Analyzing sentiment...                          │
│                                                           │
│           Estimated time: 15 seconds                      │
└───────────────────────────────────────────────────────────┘
```

### Empty State (No Analysis)

```
┌───────────────────────────────────────────────────────────┐
│ 🤖 AI Analysis                                            │
├───────────────────────────────────────────────────────────┤
│                                                           │
│                      🤖                                   │
│                                                           │
│         AI-Powered Survey Analysis                        │
│                                                           │
│   Get instant insights from your survey responses.        │
│   AI will identify themes, sentiment, and provide         │
│   actionable recommendations.                             │
│                                                           │
│               [Analyze Survey Responses]                  │
│                                                           │
│   • Analysis takes ~20 seconds for 50 responses           │
│   • Results are cached for quick access                   │
│   • Costs approximately $0.20 per analysis                │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## AI Integration

### Claude API Configuration

**Model:** `claude-3-5-sonnet-20241022`

**Why This Model?**
- Strong analytical capabilities
- Good at identifying themes and patterns
- Handles structured output well
- Cost-effective ($3/M input tokens, $15/M output tokens)
- Fast response times (~20 seconds for 50 responses)

**Alternative Models:**

| Model | Best For | Speed | Cost | Quality |
|-------|----------|-------|------|---------|
| Claude 3.5 Sonnet | Production (recommended) | Fast | Medium | Excellent |
| Claude 3 Opus | Highest quality analysis | Slow | High | Best |
| Claude 3 Haiku | Quick summaries | Very Fast | Low | Good |

### Prompt Engineering

**System Prompt:**
```
You are an expert survey analyst helping a portal administration team understand user feedback.

Your task is to analyze survey responses and provide:
1. A concise executive summary
2. Key themes with frequency counts
3. Sentiment analysis (positive/neutral/negative breakdown)
4. Actionable recommendations prioritized by impact
5. Notable quotes that illustrate main points

Format your response as JSON matching this schema:
{schema here}

Guidelines:
- Be specific and quantitative (use percentages, counts)
- Prioritize actionable insights over generic observations
- Include direct quotes to support themes
- Use neutral, professional language
- Focus on what matters most to decision-makers
```

**User Prompt Template:**
```
Analyze the following survey responses:

Survey: {{survey_title}}
Questions: {{question_count}}
Responses: {{response_count}}

{{#each questions}}
Question {{@index}}: {{question_text}}
Type: {{question_type}}

Responses:
{{#each responses}}
- User {{user_id}}: {{answer_value}}
{{/each}}

{{/each}}

Provide a comprehensive analysis following the schema provided in the system prompt.
```

### Token Optimization

**Strategies to Reduce Costs:**

1. **Summarize Long Responses**
   - For open-ended questions with 500+ word responses
   - Pre-process to extract key sentences
   - Can reduce tokens by 50-70%

2. **Batch Similar Questions**
   - Group multiple-choice questions together
   - Analyze patterns across similar question types

3. **Progressive Analysis**
   - Start with high-level summary (fewer tokens)
   - Drill down on request (pay only when needed)

4. **Caching Strategy**
   - Use Claude's prompt caching feature
   - Cache survey structure and questions
   - Only pay for new responses

**Example Token Usage:**

| Survey Size | Input Tokens | Output Tokens | Total | Cost |
|-------------|--------------|---------------|-------|------|
| 10 responses, 5 questions | ~5,000 | ~1,500 | 6,500 | $0.04 |
| 50 responses, 5 questions | ~25,000 | ~2,500 | 27,500 | $0.11 |
| 100 responses, 10 questions | ~60,000 | ~3,500 | 63,500 | $0.23 |
| 500 responses, 10 questions | ~300,000 | ~5,000 | 305,000 | $0.98 |

---

## Cost Analysis

### API Costs (Claude)

**Pricing:**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

**Typical Survey Analysis:**
- 50 responses × 5 questions = 250 answers
- Average answer: 50 words = ~70 tokens
- Total input: 250 × 70 = ~17,500 tokens
- Output: ~2,000 tokens (analysis)
- **Cost per analysis: ~$0.08**

### Monthly Cost Projections

**Scenario 1: Low Volume (4 surveys/month)**
- 4 surveys × 1 analysis each = 4 analyses
- 4 × $0.08 = **$0.32/month**

**Scenario 2: Medium Volume (10 surveys/month)**
- 10 surveys × 2 analyses each (initial + refresh) = 20 analyses
- 20 × $0.08 = **$1.60/month**

**Scenario 3: High Volume (20 surveys/month)**
- 20 surveys × 3 analyses each = 60 analyses
- 60 × $0.08 = **$4.80/month**

**Scenario 4: Very High Volume (50 surveys/month)**
- 50 surveys × 3 analyses each = 150 analyses
- 150 × $0.08 = **$12.00/month**

### Infrastructure Costs

**Supabase:**
- Edge Function invocations: Free tier (500K/month)
- Database storage: ~1MB per analysis × 100 analyses = 100MB (~$0.001/month)
- **Total: ~$0.00/month** (within free tier)

### Development Costs

**One-Time:**
- Phase 1 (MVP): 40 hours × $100/hour = $4,000
- Phase 2 (Caching): 40 hours × $100/hour = $4,000
- Phase 3 (Enhanced): 80 hours × $100/hour = $8,000
- **Total: $16,000**

**Ongoing:**
- Maintenance: 4 hours/month × $100/hour = $400/month
- Prompt optimization: 2 hours/quarter × $100/hour = $200/quarter

### ROI Analysis

**Costs:**
- Development: $16,000 (one-time)
- API: ~$5/month
- Maintenance: $400/month

**Benefits:**
- Time saved: 10 hours/month × $50/hour = $500/month
- Better insights: Estimated $1,000/month value (better decisions)
- **Total value: $1,500/month**

**Break-even:**
- $16,000 ÷ ($1,500 - $405) = ~15 months
- After 15 months: $1,095/month net benefit

**3-Year ROI:**
- Investment: $16,000 + ($405 × 36) = $30,580
- Value: $1,500 × 36 = $54,000
- **Net benefit: $23,420**
- **ROI: 77%**

---

## Success Metrics

### Usage Metrics

1. **Adoption Rate**
   - Target: 80% of surveys analyzed within 7 days
   - Measure: `analyses_run / surveys_published`

2. **Re-analysis Frequency**
   - Target: <30% re-analysis rate (good caching)
   - Measure: `re_analyses / total_analyses`

3. **Response Time**
   - Target: <30 seconds for 90% of analyses
   - Measure: `avg(analysis_duration)`

### Quality Metrics

1. **Admin Satisfaction**
   - Survey question: "How helpful is the AI analysis?"
   - Target: 4.0+ / 5.0 rating

2. **Insight Actionability**
   - Track: Actions taken based on AI recommendations
   - Target: 50% of recommendations result in action

3. **Accuracy**
   - Manual review of 10% of analyses
   - Target: 90% accuracy in theme identification

### Business Metrics

1. **Time Savings**
   - Baseline: 2.5 hours manual analysis per survey
   - Target: 95% reduction (to <10 minutes)

2. **Decision Speed**
   - Time from survey close to action taken
   - Target: Reduce from 2 weeks to 3 days

3. **User Satisfaction Impact**
   - Track portal NPS before/after implementing AI recommendations
   - Target: 10-point NPS increase

---

## Testing Strategy

### Unit Tests

**Backend (Edge Function):**
```typescript
describe('analyze-survey function', () => {
  test('returns analysis for valid survey', async () => {
    const result = await analyzeSurvey(testSurveyId)
    expect(result.analysis).toBeDefined()
    expect(result.analysis.summary).toBeTruthy()
  })

  test('handles survey with no responses', async () => {
    await expect(analyzeSurvey(emptySurveyId))
      .rejects.toThrow('NO_RESPONSES')
  })

  test('respects rate limits', async () => {
    // Make 11 requests rapidly
    const requests = Array(11).fill(null).map(() =>
      analyzeSurvey(testSurveyId)
    )
    await expect(Promise.all(requests))
      .rejects.toThrow('RATE_LIMIT')
  })
})
```

**Frontend (Component):**
```typescript
describe('SurveyAnalysisPanel', () => {
  test('shows empty state initially', () => {
    render(<SurveyAnalysisPanel surveyId={testId} />)
    expect(screen.getByText('Analyze Survey')).toBeInTheDocument()
  })

  test('displays analysis after clicking analyze', async () => {
    render(<SurveyAnalysisPanel surveyId={testId} />)
    fireEvent.click(screen.getByText('Analyze Survey'))
    await waitFor(() => {
      expect(screen.getByText(/Key Themes/)).toBeInTheDocument()
    })
  })

  test('shows cached indicator', async () => {
    // Mock cached analysis
    render(<SurveyAnalysisPanel surveyId={testId} />)
    await waitFor(() => {
      expect(screen.getByText(/Last analyzed:/)).toBeInTheDocument()
    })
  })
})
```

### Integration Tests

1. **End-to-End Flow**
   ```typescript
   test('complete analysis workflow', async () => {
     // 1. Navigate to survey
     await page.goto('/admin/data/survey-analytics')
     await page.click('[data-survey-id="test-survey"]')

     // 2. Click analyze
     await page.click('button:has-text("Analyze Survey")')

     // 3. Wait for analysis
     await page.waitForSelector('.analysis-result', { timeout: 40000 })

     // 4. Verify content
     expect(await page.textContent('.summary')).toBeTruthy()
     expect(await page.$$('.theme-card')).toHaveLength(3)

     // 5. Verify cache on reload
     await page.reload()
     expect(await page.textContent('.cache-indicator')).toContain('Last analyzed')
   })
   ```

2. **API Integration**
   ```typescript
   test('Claude API integration', async () => {
     const response = await fetch('/.netlify/functions/analyze-survey', {
       method: 'POST',
       body: JSON.stringify({ surveyId: testId })
     })

     expect(response.status).toBe(200)
     const data = await response.json()
     expect(data.analysis.key_themes).toBeDefined()
   })
   ```

### Load Testing

**Scenario 1: Concurrent Analyses**
```bash
# Artillery load test
artillery quick --count 10 --num 5 \
  https://api.portal.com/analyze-survey
```

**Expected:**
- All 50 requests complete successfully
- Average response time <35 seconds
- No rate limit errors (due to queuing)

**Scenario 2: Large Survey**
```typescript
test('handles 500 response survey', async () => {
  const largesurveyId = createSurveyWith500Responses()

  const result = await analyzeSurvey(largeSurveyId)

  expect(result.analysis).toBeDefined()
  expect(result.metadata.responseCount).toBe(500)
}, 120000) // 2 minute timeout
```

### Manual Testing Checklist

**Phase 1 - MVP:**
- [ ] Analyze button appears on Survey Analytics page
- [ ] Clicking button triggers analysis
- [ ] Loading state displays during analysis
- [ ] Analysis result displays with summary
- [ ] Error handling works (no responses, API error)
- [ ] Works with different survey sizes (10, 50, 100 responses)

**Phase 2 - Caching:**
- [ ] Cached analysis loads instantly (<1 sec)
- [ ] "Last analyzed" timestamp displays
- [ ] Re-analyze button updates cache
- [ ] Database stores analysis correctly
- [ ] Cost and token metadata saved

**Phase 3 - Enhanced:**
- [ ] Structured analysis displays (themes, sentiment, actions)
- [ ] Visual charts render correctly
- [ ] PDF export works
- [ ] Comparison view shows trends

---

## Security & Privacy

### Authentication & Authorization

**Requirements:**
- Only admins can trigger analysis
- Only admins can view analysis results
- Audit log who ran analysis and when

**Implementation:**
```typescript
// Edge function auth check
const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization'))
if (!user) throw new Error('UNAUTHORIZED')

const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (!['admin', 'super_admin', 'system_admin'].includes(profile.role)) {
  throw new Error('UNAUTHORIZED')
}
```

### Data Privacy

**Considerations:**
1. **PII in Responses**
   - Survey responses may contain names, emails, phone numbers
   - Claude API processes this data

2. **Options:**

**Option A: Send All Data (Simplest)**
- ✅ Most accurate analysis
- ❌ PII exposed to third party (Anthropic)
- ❌ May violate privacy policies
- **Use when:** Surveys explicitly don't collect PII

**Option B: Anonymize Before Sending**
- ✅ No PII exposed
- ❌ May lose context for analysis
- ❌ More complex to implement
- **Use when:** Surveys may contain PII

```typescript
function anonymizeResponse(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
}
```

**Option C: Process Locally (Most Secure)**
- ✅ No data leaves infrastructure
- ❌ Need to self-host LLM (expensive)
- ❌ Much more complex
- **Use when:** Extremely sensitive data

**Recommendation:** Option A for now (our surveys don't collect PII), implement Option B as feature flag for future.

### API Key Security

**Requirements:**
- Never expose Anthropic API key in frontend
- Store in environment variables
- Rotate keys quarterly

**Implementation:**
```bash
# Supabase secrets
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Access in Edge Function
const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
```

### Audit Logging

**Track:**
- Who ran analysis
- When
- Which survey
- Cost incurred

```sql
-- Already captured in survey_analysis table
SELECT
  analyzed_by,
  analyzed_at,
  survey_id,
  cost_usd
FROM survey_analysis
ORDER BY analyzed_at DESC;
```

---

## Risks & Mitigation

### Risk 1: API Costs Exceed Budget

**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Implement hard cost cap in code
- Alert at 80% of monthly budget
- Rate limit per user (10 analyses/day)
- Aggressive caching to prevent duplicate analyses

```typescript
const MONTHLY_BUDGET_USD = 100

async function checkBudget() {
  const { data } = await supabase
    .from('survey_analysis')
    .select('cost_usd')
    .gte('analyzed_at', startOfMonth())

  const totalSpent = data.reduce((sum, a) => sum + a.cost_usd, 0)

  if (totalSpent >= MONTHLY_BUDGET_USD) {
    throw new Error('COST_LIMIT')
  }
}
```

### Risk 2: Poor Analysis Quality

**Probability:** Low
**Impact:** High
**Mitigation:**
- Manual review of first 10 analyses
- A/B test prompts to optimize quality
- Collect admin feedback ("Was this helpful?")
- Iterate on prompts based on feedback

### Risk 3: Claude API Downtime

**Probability:** Low
**Impact:** Medium
**Mitigation:**
- Graceful error handling
- Retry logic (3 attempts with backoff)
- Show cached analysis if available
- Display friendly error message

```typescript
async function analyzeSurveyWithRetry(surveyId: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callClaudeAPI(surveyId)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(2 ** i * 1000) // Exponential backoff
    }
  }
}
```

### Risk 4: Slow Response Times

**Probability:** Medium
**Impact:** Low
**Mitigation:**
- Streaming responses (show progress)
- Background processing for large surveys (>100 responses)
- Optimize prompt to reduce token count
- Use Claude 3 Haiku for quick summaries

### Risk 5: Inaccurate Insights

**Probability:** Low
**Impact:** Medium
**Mitigation:**
- Always show raw data alongside AI analysis
- Include confidence levels in themes
- Add disclaimer: "AI-generated insights - verify before acting"
- Track if recommendations actually improve metrics

---

## Next Steps

### To Proceed with Development

1. **Get Approval**
   - [ ] Review this spec with stakeholders
   - [ ] Approve budget allocation ($16K + $5/month)
   - [ ] Confirm priority (vs. other features)

2. **Prepare Environment**
   - [ ] Create Anthropic account
   - [ ] Get API key
   - [ ] Set up Supabase secrets
   - [ ] Create feature branch

3. **Phase 1 Development** (Week 1)
   - [ ] Build Edge Function
   - [ ] Create UI component
   - [ ] Integrate with Survey Analytics page
   - [ ] Test with real survey data
   - [ ] Deploy to staging

4. **Review & Iterate**
   - [ ] Admin testing
   - [ ] Collect feedback
   - [ ] Refine prompts
   - [ ] Deploy to production

5. **Phase 2+** (Weeks 2-4)
   - [ ] Implement caching
   - [ ] Add advanced features
   - [ ] Polish UI
   - [ ] Documentation

---

## Questions & Answers

**Q: Can we use a cheaper AI model?**
A: Yes, Claude 3 Haiku costs 80% less but quality may suffer. Recommend starting with Sonnet, downgrade if budget is concern.

**Q: What if survey has 1000+ responses?**
A: Implement batching (analyze in chunks) or use background processing queue. May take 2-5 minutes but works fine.

**Q: Can we analyze surveys in other languages?**
A: Yes, Claude supports 100+ languages. No code changes needed.

**Q: What about analyzing images/charts users upload?**
A: Claude Vision can handle images. Would need to send image URLs in prompt. Adds complexity and cost.

**Q: Can we compare multiple surveys?**
A: Yes, planned for Phase 3. Would analyze trends across surveys over time.

---

**End of Documentation**

For questions or to propose changes, contact the product team.
