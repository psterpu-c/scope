/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Stack, Typography } from '@mui/material';
import { Spinner } from '@open-ui-kit/core';
import { useApplicationSummaryMetrics, useSessionsIoC } from '@/api/scopeApi';
import { metricCatalog } from '@/common';
import { useTimeRangeStore } from '@/store';
import { ApplicationSummaryQualityMetric } from '@/types/scope.type';
import { useDebouncedValue } from '@/utils';
import { formatMetricValue } from '@/utils/metrics';
import { WidgetCard } from '../WidgetCard/WidgetCard';

// Keys of the metric catalog shown in each section.
const QUALITY_METRIC_KEYS = [
  'Groundedness',
  'AnswerRelevancy',
  'ResponseCompleteness',
  'ToolUtilizationAccuracy',
  'IntentRecognitionAccuracy'
];
const PERFORMANCE_METRIC_KEYS = [
  'LLMErrorRate',
  'ToolErrorRate',
  'CyclesCount',
  'WorkflowEfficiency'
];

// The average of each metric for the session. The metric points of the
// application summary are one per session, at the timestamp of the session; a
// metric with several points for the session gets their average.
const getSessionAverages = (
  series: ApplicationSummaryQualityMetric[],
  sessionTimestamp: string | undefined
): Record<string, number> => {
  const averages: Record<string, number> = {};
  if (!sessionTimestamp) return averages;

  const key = String(Number(sessionTimestamp));
  for (const metric of series) {
    const values = metric.values
      .filter(([timestamp]) => String(timestamp) === key)
      .map(([, value]) => value);
    if (values.length > 0) {
      averages[metric.metric_name] =
        values.reduce((sum, value) => sum + value, 0) / values.length;
    }
  }
  return averages;
};

interface MetricsSectionProps {
  title: string;
  metricKeys: string[];
  averages: Record<string, number>;
}

const MetricsSection = ({
  title,
  metricKeys,
  averages
}: MetricsSectionProps) => (
  <Stack gap={'8px'}>
    <Typography variant={'h6'}>{title}</Typography>
    <Grid container spacing={'8px'} columns={10}>
      {metricKeys.map((key) => {
        const catalogEntry = metricCatalog[key as keyof typeof metricCatalog];
        if (!catalogEntry) return null;
        const average = averages[key];
        return (
          <Grid key={key} size={{ md: 5, lg: 2 }}>
            <WidgetCard
              title={catalogEntry.name}
              content={
                <Typography variant={'h6'}>
                  {average === undefined
                    ? '—'
                    : formatMetricValue(average, catalogEntry.unit)}
                </Typography>
              }
              cardSx={{ width: '100%' }}
            />
          </Grid>
        );
      })}
    </Grid>
  </Stack>
);

// The quality and performance metrics of the session, as averages from the
// application summary metrics (the application and the session come from the
// route).
export const SessionMetrics = () => {
  const { applicationId = '', sessionId = '' } = useParams();
  const { startDate, endDate } = useTimeRangeStore();
  const debouncedStartDate = useDebouncedValue(startDate, 500);
  const debouncedEndDate = useDebouncedValue(endDate, 500);

  const summaryQuery = useApplicationSummaryMetrics(
    applicationId,
    debouncedStartDate,
    debouncedEndDate
  );
  // The sessions of the application, to get the timestamp of the session.
  const sessionsQuery = useSessionsIoC(
    applicationId,
    debouncedStartDate,
    debouncedEndDate
  );

  const sessionTimestamp = useMemo(
    () =>
      sessionsQuery.data?.find((session) => session.sessionId === sessionId)
        ?.timestamp,
    [sessionsQuery.data, sessionId]
  );
  const qualityAverages = useMemo(
    () =>
      getSessionAverages(summaryQuery.data?.quality ?? [], sessionTimestamp),
    [summaryQuery.data?.quality, sessionTimestamp]
  );
  const performanceAverages = useMemo(
    () =>
      getSessionAverages(
        summaryQuery.data?.performance ?? [],
        sessionTimestamp
      ),
    [summaryQuery.data?.performance, sessionTimestamp]
  );

  if (!applicationId || !sessionId) {
    return null;
  }

  if (summaryQuery.isLoading || sessionsQuery.isLoading) {
    return (
      <Stack
        justifyContent={'center'}
        alignItems={'center'}
        sx={{ width: '100%', minHeight: '100px' }}
      >
        <Spinner />
      </Stack>
    );
  }

  if (summaryQuery.isError) {
    return (
      <Typography variant={'h6'}>Error fetching session metrics</Typography>
    );
  }

  return (
    <Stack gap={'24px'}>
      <MetricsSection
        title={'Quality'}
        metricKeys={QUALITY_METRIC_KEYS}
        averages={qualityAverages}
      />
      <MetricsSection
        title={'Performance'}
        metricKeys={PERFORMANCE_METRIC_KEYS}
        averages={performanceAverages}
      />
    </Stack>
  );
};
