/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { GaugeChart, Spinner, Stack } from '@open-ui-kit/core';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  CustomTooltip,
  DateInterval,
  IntervalPicker,
  MetricChart,
  PageWithTitle,
  SessionsTableIoC,
  SessionWithMetrics
} from '@/components';
import {
  ApplicationLevelMetricCategoryDescription,
  ApplicationLevelMetricCategoryLabels,
  applicationLevelMetrics
} from '@/api/applicationLevelMetrics';
import { useApplicationSummaryMetrics, useSessionsIoC } from '@/api/scopeApi';
import { pageGradientBottomSx, pageGradientContentSx } from '@/common/styles';
import { PATHS } from '@/routes/routes.tsx';
import { useOpenSessionDetails } from '@/hooks/useOpenSessionDetails';
import { useTimeRangeStore } from '@/store';
import {
  ApplicationSummaryMetricsValue,
  TimelineData,
  Unit
} from '@/types/scope.type';
import { getScoreVariant, useDebouncedValue } from '@/utils';
import { computeOverallPerformance } from '@/utils/metrics';

const METRIC_CATEGORY = 'performance';
// Gauge diameter in px (the open-ui-kit default is 132)
const GAUGE_SIZE = 180;

const apiMetricNameToDefKey: Record<string, string> = {
  LLMErrorRate: 'llmErrorRate',
  ToolErrorRate: 'toolErrorRate',
  CyclesCount: 'cyclesCount',
  WorkflowEfficiency: 'workflowEfficiency'
};

// The session metrics shown as columns of the sessions table.
const SESSION_METRIC_KEYS = Object.keys(apiMetricNameToDefKey);

// Metrics that are plain counts rather than percentages
const scalarMetrics = new Set(['CyclesCount']);

const toTimelineData = (
  values: ApplicationSummaryMetricsValue[],
  apiMetricName: string
): TimelineData[] => {
  const isScalar = scalarMetrics.has(apiMetricName);
  return values.map(([timestamp, pointValue]) => ({
    timestamp: new Date(timestamp * 1000).toISOString(),
    sessionIDs: ['_'],
    value: isScalar
      ? { unit: Unit.Scalar, value: pointValue }
      : { unit: Unit.Percentage, value: Math.round(pointValue) }
  }));
};

const chartGridSize = { xxl: 6, xl: 12, lg: 12, md: 12, sm: 12, xs: 12 };

const ApplicationDetailsPerformance = () => {
  const { applicationId = '' } = useParams();
  const openSessionDetails = useOpenSessionDetails(
    applicationId,
    'Performance'
  );
  const theme = useTheme();
  const { startDate, endDate, setStartDate, setEndDate } = useTimeRangeStore();
  const debouncedStartDate = useDebouncedValue(startDate, 500);
  const debouncedEndDate = useDebouncedValue(endDate, 500);

  const {
    data: applicationSummaryMetrics,
    isLoading,
    isError,
    error
  } = useApplicationSummaryMetrics(
    applicationId,
    debouncedStartDate,
    debouncedEndDate
  );

  const overallPerformance = useMemo(
    () =>
      computeOverallPerformance(applicationSummaryMetrics?.performance ?? []),
    [applicationSummaryMetrics?.performance]
  );

  const metricDefs = applicationLevelMetrics[METRIC_CATEGORY];

  const chartDataMap = useMemo(() => {
    const map: Record<string, TimelineData[]> = {};
    for (const metric of applicationSummaryMetrics?.performance ?? []) {
      const defKey =
        apiMetricNameToDefKey[metric.metric_name] ?? metric.metric_name;
      map[defKey] = toTimelineData(metric.values, metric.metric_name);
    }
    return map;
  }, [applicationSummaryMetrics?.performance]);

  const { data: sessions, isLoading: sessionsLoading } = useSessionsIoC(
    applicationId,
    debouncedStartDate,
    debouncedEndDate
  );

  // Join of the sessions with the performance metrics. The metric points of the
  // summary are one per session, at the timestamp of the session. A session
  // with several values for a metric gets their average, one without gets none.
  const sessionsWithMetrics = useMemo<SessionWithMetrics[]>(() => {
    const valuesBySessionTimestamp = new Map<
      string,
      Record<string, number[]>
    >();
    for (const metric of applicationSummaryMetrics?.performance ?? []) {
      for (const [timestamp, value] of metric.values) {
        const key = String(timestamp);
        const byMetric = valuesBySessionTimestamp.get(key) ?? {};
        (byMetric[metric.metric_name] ??= []).push(value);
        valuesBySessionTimestamp.set(key, byMetric);
      }
    }

    return (sessions ?? []).map((session) => {
      const byMetric =
        valuesBySessionTimestamp.get(String(Number(session.timestamp))) ?? {};
      const metrics: SessionWithMetrics['metrics'] = {};
      for (const [name, values] of Object.entries(byMetric)) {
        metrics[name] = values.reduce((sum, v) => sum + v, 0) / values.length;
      }
      return { ...session, metrics };
    });
  }, [sessions, applicationSummaryMetrics?.performance]);

  const applicationDetailsPath = useMemo(
    () =>
      PATHS.application.replace(
        ':applicationId',
        encodeURIComponent(applicationId)
      ),
    [applicationId]
  );

  const breadcrumbItems = useMemo(
    () => [
      { text: 'Applications', link: PATHS.applications },
      {
        text: applicationId,
        link: applicationDetailsPath
      },
      {
        text: 'Performance',
        link: PATHS.applicationPerformance.replace(
          ':applicationId',
          encodeURIComponent(applicationId)
        )
      }
    ],
    [applicationId, applicationDetailsPath]
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ width: '100%', height: '100%', minHeight: '100px' }}
        >
          <Spinner />
        </Stack>
      );
    }

    if (isError) {
      return (
        <Stack gap="4px">
          <Typography color="error">
            Failed to load performance metrics.
          </Typography>
          <Typography variant="caption">
            {error instanceof Error ? error.message : ''}
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack direction="column" gap="32px" sx={{ width: '100%' }}>
        <Stack direction="row" gap="32px" alignItems="center">
          <GaugeChart
            data={[
              {
                name: ApplicationLevelMetricCategoryLabels[METRIC_CATEGORY],
                value: overallPerformance
              }
            ]}
            variant={getScoreVariant(overallPerformance)}
            styleProps={{ customWidth: GAUGE_SIZE, customHeight: GAUGE_SIZE }}
          />
        </Stack>

        <Grid container spacing="16px">
          {Object.entries(metricDefs).map(([key, def]) => (
            <Grid size={chartGridSize} key={key}>
              <MetricChart
                data={chartDataMap[key] ?? []}
                metricKey={key}
                metricDef={def}
                chartSuffix=""
                operation={def.operation ?? 'average'}
                chartType="scatter"
              />
            </Grid>
          ))}
        </Grid>
      </Stack>
    );
  };

  return (
    <Box sx={pageGradientBottomSx}>
      <PageWithTitle
        title={
          <Stack
            direction="row"
            gap="4px"
            sx={{ marginTop: '16px' }}
            justifyContent="space-between"
          >
            <Stack direction="row" gap="4px">
              <Typography
                variant="h5"
                sx={{ color: theme.palette.vars.controlIconStrong }}
              >
                {ApplicationLevelMetricCategoryLabels[METRIC_CATEGORY]}
              </Typography>
              <CustomTooltip
                title={
                  <Typography variant="caption" sx={{ whiteSpace: 'pre-line' }}>
                    {ApplicationLevelMetricCategoryDescription[METRIC_CATEGORY]}
                  </Typography>
                }
                placement="top"
                sx={{ maxWidth: '550px' }}
              >
                <InfoOutlineIcon
                  sx={{ width: '14px', height: '14px', cursor: 'pointer' }}
                />
              </CustomTooltip>
            </Stack>
            <Typography
              component={RouterLink}
              to={applicationDetailsPath}
              variant="body2"
              sx={{
                color: theme.palette.vars.interactivePrimaryDefaultDefault,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {`< Back to ${applicationId}`}
            </Typography>
          </Stack>
        }
        breadcrumbItems={breadcrumbItems}
        sx={pageGradientContentSx}
      >
        <Stack direction="column" gap="32px" sx={{ width: '100%' }}>
          <Stack direction="column" gap="4px">
            <IntervalPicker
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
            <DateInterval
              startTime={debouncedStartDate}
              endTime={debouncedEndDate}
            />
          </Stack>
          {renderContent()}
          <Box sx={{ width: '100%', overflow: 'auto' }}>
            <SessionsTableIoC
              sessions={sessionsWithMetrics}
              isLoading={sessionsLoading || isLoading}
              onSessionClick={openSessionDetails}
              metricKeys={SESSION_METRIC_KEYS}
              startTime={debouncedStartDate}
              endTime={debouncedEndDate}
            />
          </Box>
        </Stack>
      </PageWithTitle>
    </Box>
  );
};

export default ApplicationDetailsPerformance;
