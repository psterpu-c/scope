/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { Grid, Stack, Typography, alpha, useTheme } from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import { useCallback, useMemo } from 'react';
import { Spinner } from '@open-ui-kit/core';
import { WidgetCard } from '@/components';
import { formatMetricValue } from '@/utils/metrics';
import {
  useAnomalyReport,
  useSemanticGroups,
  useSessionStatefulEval
} from '@/api/scopeApi';
import { metricCatalog } from '@/common';
import { Unit } from '@/types/scope.type';
import { PATHS } from '@/routes/routes';

export interface SessionMetricsWidgetsProps {
  // Keys of the metrics to display, from the metric catalog
  metricKeys: string[];
}

// A widget per metric of the session. The metrics of an outlier session are
// highlighted, and a click opens the semantic group of the session.
export const SessionMetricsWidgets = ({
  metricKeys
}: SessionMetricsWidgetsProps) => {
  const { sessionId, applicationId } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();

  const sessionMetricsQuery = useSessionStatefulEval(sessionId ?? '');

  const { data: semanticGroupsData } = useSemanticGroups(applicationId ?? '');

  const sessionSemanticGroupId = useMemo(() => {
    if (!semanticGroupsData || !sessionId) return '';
    return (
      semanticGroupsData.find((group) => group.session_ids.includes(sessionId))
        ?.id ?? ''
    );
  }, [semanticGroupsData, sessionId]);

  const isClickable = !!applicationId && !!sessionSemanticGroupId;

  const cardSxOverride = { width: '100%' };

  const outlierCardSx = {
    ...cardSxOverride,
    // Use the `background` shorthand (not `backgroundColor`): WidgetCard renders
    // its Card with the `connector` treatment, whose own `background` shorthand
    // paints gradient layers that mask a plain `backgroundColor` override.
    background: alpha(theme.palette.vars.negativeBackgroundDefault, 0.6),
    cursor: isClickable ? 'pointer' : 'default',
    '&:hover': isClickable
      ? {
          background: alpha(theme.palette.vars.negativeBackgroundDefault, 0.7)
        }
      : undefined
  };

  const baseCardSx = {
    ...cardSxOverride,
    cursor: isClickable ? 'pointer' : 'default',
    '&:hover': isClickable
      ? { backgroundColor: theme.palette.vars.baseBackgroundMedium }
      : undefined
  };

  const { data: anomalyReportData } = useAnomalyReport(sessionSemanticGroupId);

  const outlierMetricNames = useMemo(() => {
    const metrics = new Set<string>();
    if (!anomalyReportData?.reports || !sessionId) return metrics;

    for (const report of anomalyReportData.reports) {
      if (!report.outliers_values.includes(sessionId)) continue;
      try {
        const metadata = JSON.parse(report.metadata) as { metric: string };
        metrics.add(metadata.metric);
      } catch {
        continue;
      }
    }
    return metrics;
  }, [anomalyReportData, sessionId]);

  const sessionMetrics = useMemo(() => {
    const metricsData = sessionMetricsQuery.data?.metrics;
    if (!metricsData) return null;

    const result: Record<
      string,
      { value: string | number; unit: Unit; name: string }
    > = {};

    for (const metric of metricsData) {
      const catalogEntry =
        metricCatalog[metric.name as keyof typeof metricCatalog];

      if (!catalogEntry) {
        continue;
      }

      const metricValue = metric.value ?? 0;
      const formattedValue = formatMetricValue(
        Number(metricValue),
        catalogEntry.unit
      );
      result[metric.name] = {
        value: formattedValue,
        unit: catalogEntry.unit,
        name: catalogEntry.name
      };
    }

    return result;
  }, [sessionMetricsQuery.data]);

  const handleMetricCardClick = useCallback(() => {
    if (!applicationId || !sessionSemanticGroupId) return;
    navigate(
      PATHS.applicationAnalyzeOverviewSemanticGroup
        .replace(':applicationId', applicationId)
        .replace(':semanticGroup', sessionSemanticGroupId)
    );
  }, [navigate, applicationId, sessionSemanticGroupId]);

  if (!sessionId) {
    return null;
  }

  if (sessionMetricsQuery.isLoading) {
    return (
      <Stack
        justifyContent={'center'}
        alignItems={'center'}
        sx={{ width: '100%', height: '100%' }}
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
                  {sessionMetrics?.[key]?.value ?? '—'}
                </Typography>
              }
              cardSx={outlierMetricNames.has(key) ? outlierCardSx : baseCardSx}
              onClick={handleMetricCardClick}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};
