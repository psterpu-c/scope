/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Stack, Typography } from '@mui/material';
import { Spinner } from '@open-ui-kit/core';
import { useSessionStatefulEval } from '@/api/scopeApi';
import { metricCatalog } from '@/common';
import { formatMetricValue } from '@/utils/metrics';
import { WidgetCard } from '../WidgetCard/WidgetCard';

export interface SessionMetricsProps {
  // Keys of the metrics to display, from the metric catalog. All the metrics
  // by default.
  metricKeys?: string[];
}

const ALL_METRIC_KEYS = Object.keys(metricCatalog);

// A widget per metric of the session (the session id comes from the route).
export const SessionMetrics = ({
  metricKeys = ALL_METRIC_KEYS
}: SessionMetricsProps) => {
  const { sessionId = '' } = useParams();

  const sessionMetricsQuery = useSessionStatefulEval(sessionId);

  // The formatted value of each metric of the session, by metric name.
  const metricValues = useMemo(() => {
    const values: Record<string, string | number> = {};
    for (const metric of sessionMetricsQuery.data?.metrics ?? []) {
      const catalogEntry =
        metricCatalog[metric.name as keyof typeof metricCatalog];
      if (!catalogEntry) continue;
      values[metric.name] = formatMetricValue(
        Number(metric.value ?? 0),
        catalogEntry.unit
      );
    }
    return values;
  }, [sessionMetricsQuery.data]);

  if (!sessionId) {
    return null;
  }

  if (sessionMetricsQuery.isLoading) {
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

  if (sessionMetricsQuery.isError) {
    return (
      <Typography variant={'h6'}>Error fetching session metrics</Typography>
    );
  }

  return (
    <Grid container spacing={'8px'} columns={10}>
      {metricKeys.map((key) => {
        const catalogEntry = metricCatalog[key as keyof typeof metricCatalog];
        if (!catalogEntry) return null;
        return (
          <Grid key={key} size={{ md: 5, lg: 2 }}>
            <WidgetCard
              title={catalogEntry.name}
              content={
                <Typography variant={'h6'}>
                  {metricValues[key] ?? '—'}
                </Typography>
              }
              cardSx={{ width: '100%' }}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};
