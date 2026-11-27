/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { Button, Card, GaugeChart, Spinner, Stack } from '@open-ui-kit/core';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
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
import { getInsightMessage, getScoreVariant, useDebouncedValue } from '@/utils';
import { computeOverallQuality } from '@/utils/metrics';

const METRIC_CATEGORY = 'quality';
// Gauge diameter in px (the open-ui-kit default is 132)
const GAUGE_SIZE = 180;

const apiMetricNameToDefKey: Record<string, string> = {
  Groundedness: 'answerGroundedness',
  AnswerRelevancy: 'answerRelevancy',
  ResponseCompleteness: 'completeness',
  ToolUtilizationAccuracy: 'toolUtilizationAccuracy',
  IntentRecognitionAccuracy: 'intentRecognitionAccuracy'
};

// The session metrics shown as columns of the sessions table.
const SESSION_METRIC_KEYS = Object.keys(apiMetricNameToDefKey);

const toTimelineData = (
  values: ApplicationSummaryMetricsValue[]
): TimelineData[] =>
  values.map(([timestamp, pointValue]) => ({
    timestamp: new Date(timestamp * 1000).toISOString(),
    sessionIDs: ['_'],
    value: { unit: Unit.Percentage, value: Math.round(pointValue) }
  }));

const chartGridSize = { xxl: 6, xl: 12, lg: 12, md: 12, sm: 12, xs: 12 };

const ApplicationDetailsQuality = () => {
  const { applicationId = '' } = useParams();
  const openSessionDetails = useOpenSessionDetails(applicationId, 'Quality');
  const navigate = useNavigate();
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

  const overallQuality = useMemo(
    () => computeOverallQuality(applicationSummaryMetrics?.quality ?? []),
    [applicationSummaryMetrics?.quality]
  );

  const metricDefs = applicationLevelMetrics[METRIC_CATEGORY];

  const chartDataMap = useMemo(() => {
    const map: Record<string, TimelineData[]> = {};
    for (const metric of applicationSummaryMetrics?.quality ?? []) {
      const defKey =
        apiMetricNameToDefKey[metric.metric_name] ?? metric.metric_name;
      map[defKey] = toTimelineData(metric.values);
    }
    return map;
  }, [applicationSummaryMetrics?.quality]);

  const { data: sessions, isLoading: sessionsLoading } = useSessionsIoC(
    applicationId,
    debouncedStartDate,
    debouncedEndDate
  );

  // Join of the sessions with the quality metrics. The metric points of the
  // summary are one per session, at the timestamp of the session. A session
  // with several values for a metric gets their average, one without gets none.
  const sessionsWithMetrics = useMemo<SessionWithMetrics[]>(() => {
    const valuesBySessionTimestamp = new Map<
      string,
      Record<string, number[]>
    >();
    for (const metric of applicationSummaryMetrics?.quality ?? []) {
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
  }, [sessions, applicationSummaryMetrics?.quality]);

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
        text: 'Quality',
        link: PATHS.applicationQuality.replace(
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
          <Typography color="error">Failed to load quality metrics.</Typography>
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
                value: overallQuality
              }
            ]}
            variant={getScoreVariant(overallQuality)}
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

export default ApplicationDetailsQuality;
