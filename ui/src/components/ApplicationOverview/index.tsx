/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment, useMemo } from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { Divider, Spinner } from '@open-ui-kit/core';
import {
  useApplicationSummaryMetrics,
  useCognitiveHealth
} from '@/api/scopeApi';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '@/routes/routes.tsx';
import { useTimeRangeStore } from '@/store';
import { useDebouncedValue } from '@/utils';
import {
  computeOverallQuality,
  computeOverallPerformance
} from '@/utils/metrics';

export interface ApplicationOverviewProps {
  applicationId: string;
}

interface HealthMetric {
  key: string;
  title: string;
  description: string;
  /** 0-100 */
  value: number;
  color: string;
  radius: number;
  /** When set, clicking the metric navigates here */
  path?: string;
}

// Chart geometry (SVG user units)
const VIEW_WIDTH = 1020;
const VIEW_HEIGHT = 510;
const CENTER_X = 517;
const CENTER_Y = 496;
const ARC_STROKE_WIDTH = 12;
const ARC_RADII = { quality: 417, performance: 327, cognitive: 238 };
// Thin solid rings sit under each arc, dotted rings sit between/inside them
const SOLID_RING_RADII = Object.values(ARC_RADII);
const DOTTED_RING_RADII = [372, 283, 193, 148];
const QUALITY_COLOR = '#7B2093';
const PERFORMANCE_COLOR = '#00C24E';
const COGNITIVE_COLOR = '#F0555F';

const clamp = (value: number) => Math.min(100, Math.max(0, value));

const polarToCartesian = (radius: number, angleDeg: number) => {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER_X + radius * Math.cos(angleRad),
    y: CENTER_Y - radius * Math.sin(angleRad)
  };
};

/** Semicircle arc starting from the left, sweeping clockwise by `percent` of 180deg. */
const describeArc = (radius: number, percent: number) => {
  const start = polarToCartesian(radius, 180);
  const end = polarToCartesian(radius, 180 - 180 * (clamp(percent) / 100));
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
};

/** Pie slice from the chart center, covering the same angle as the arc. */
const describeSector = (radius: number, percent: number) => {
  const start = polarToCartesian(radius, 180);
  const end = polarToCartesian(radius, 180 - 180 * (clamp(percent) / 100));
  return `M ${CENTER_X} ${CENTER_Y} L ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y} Z`;
};

export const ApplicationOverview = ({
  applicationId
}: ApplicationOverviewProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { startDate, endDate } = useTimeRangeStore();
  const debouncedStartDate = useDebouncedValue(startDate, 500);
  const debouncedEndDate = useDebouncedValue(endDate, 500);

  const { data: summaryMetrics, isLoading: summaryLoading } =
    useApplicationSummaryMetrics(
      applicationId,
      debouncedStartDate,
      debouncedEndDate
    );
  const { data: cognitiveHealth, isLoading: cognitiveLoading } =
    useCognitiveHealth(applicationId, debouncedStartDate, debouncedEndDate);

  const metrics: HealthMetric[] = useMemo(
    () => [
      {
        key: 'quality',
        title: 'Quality',
        description:
          'Trip plans are clear and relevant, but some recommendations still miss a verified detail.',
        value: computeOverallQuality(summaryMetrics?.quality ?? []),
        color: QUALITY_COLOR,
        radius: ARC_RADII.quality,
        path: PATHS.applicationQuality.replace(
          ':applicationId',
          encodeURIComponent(applicationId)
        )
      },
      {
        key: 'performance',
        title: 'Performance',
        description:
          'Most trips finish smoothly, though tool handoffs and extra reasoning still slow some plans.',
        value: computeOverallPerformance(summaryMetrics?.performance ?? []),
        color: PERFORMANCE_COLOR,
        radius: ARC_RADII.performance,
        path: PATHS.applicationPerformance.replace(
          ':applicationId',
          encodeURIComponent(applicationId)
        )
      },
      {
        key: 'cognitive',
        title: 'Cognitive Health',
        description: cognitiveHealth?.description ?? '',
        value: cognitiveHealth?.score ?? 0,
        color: COGNITIVE_COLOR,
        radius: ARC_RADII.cognitive,
        path: PATHS.applicationCognitiveHealth.replace(
          ':applicationId',
          encodeURIComponent(applicationId)
        )
      }
    ],
    [summaryMetrics, cognitiveHealth, applicationId]
  );

  if (summaryLoading || cognitiveLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ width: '100%', minHeight: 300 }}
      >
        <Spinner />
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap="64px"
      sx={{ width: '100%' }}
    >
      <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          width="100%"
          role="img"
          aria-label="Application health"
        >
          <defs>
            {metrics.map((metric) => (
              <filter
                key={metric.key}
                id={`application-overview-glow-${metric.key}`}
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="4"
                  floodColor={metric.color}
                  floodOpacity="0.5"
                />
              </filter>
            ))}

            {/* Horizontal fade (from arc start to arc end) used to soften the wedges */}
            {metrics.map((metric) => {
              const start = polarToCartesian(metric.radius, 180);
              const end = polarToCartesian(
                metric.radius,
                180 - 180 * (clamp(metric.value) / 100)
              );
              return (
                <g key={`wedge-defs-${metric.key}`}>
                  <linearGradient
                    id={`application-overview-fade-${metric.key}`}
                    gradientUnits="userSpaceOnUse"
                    x1={start.x}
                    y1={0}
                    x2={Math.max(end.x, start.x + 1)}
                    y2={0}
                  >
                    <stop offset="0" stopColor="#fff" stopOpacity="1" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                  <mask
                    id={`application-overview-mask-${metric.key}`}
                    maskUnits="userSpaceOnUse"
                    x={0}
                    y={0}
                    width={VIEW_WIDTH}
                    height={VIEW_HEIGHT}
                  >
                    <rect
                      x={0}
                      y={0}
                      width={VIEW_WIDTH}
                      height={VIEW_HEIGHT}
                      fill={`url(#application-overview-fade-${metric.key})`}
                    />
                  </mask>
                </g>
              );
            })}
          </defs>

          {/* Soft colored wedges under each arc */}
          {metrics.map((metric) =>
            metric.value > 0 ? (
              <path
                key={`wedge-${metric.key}`}
                d={describeSector(metric.radius, metric.value)}
                fill={metric.color}
                fillOpacity={0.18}
                mask={`url(#application-overview-mask-${metric.key})`}
              />
            ) : null
          )}

          {/* Thin solid rings (full semicircle) */}
          {SOLID_RING_RADII.map((radius) => (
            <path
              key={`solid-ring-${radius}`}
              d={describeArc(radius, 100)}
              fill="none"
              stroke={theme.palette.vars.baseBorderMedium}
              strokeOpacity={0.6}
              strokeWidth={1.5}
            />
          ))}

          {/* Dotted rings */}
          {DOTTED_RING_RADII.map((radius) => (
            <path
              key={`dotted-ring-${radius}`}
              d={describeArc(radius, 100)}
              fill="none"
              stroke={theme.palette.vars.baseBorderMedium}
              strokeOpacity={0.7}
              strokeWidth={1}
              strokeDasharray="2 5"
            />
          ))}

          {/* Value arcs */}
          {metrics.map((metric) =>
            metric.value > 0 ? (
              <path
                key={`arc-${metric.key}`}
                d={describeArc(metric.radius, metric.value)}
                fill="none"
                stroke={metric.color}
                strokeWidth={ARC_STROKE_WIDTH}
                strokeLinecap="round"
                filter={`url(#application-overview-glow-${metric.key})`}
                style={metric.path ? { cursor: 'pointer' } : undefined}
                onClick={
                  metric.path
                    ? () => navigate(metric.path as string)
                    : undefined
                }
              />
            ) : null
          )}

          <text
            x={CENTER_X}
            y={CENTER_Y - 50}
            textAnchor="middle"
            fill={theme.palette.vars.baseTextStrong}
            fontSize="18"
            fontWeight="bold"
          >
            Application health
          </text>
        </svg>
      </Box>

      <Stack direction="column" sx={{ flex: '1 1 0', minWidth: 0 }}>
        {metrics.map((metric, index) => (
          <Fragment key={metric.key}>
            {index > 0 && <Divider />}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap="16px"
              onClick={
                metric.path ? () => navigate(metric.path as string) : undefined
              }
              sx={{
                padding: '10px 12px',
                borderRadius: '8px',
                ...(metric.path
                  ? {
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.vars.baseBackgroundMedium
                      },
                      '&:hover .view-details': { display: 'block' }
                    }
                  : {})
              }}
            >
              <Stack direction="row" alignItems="flex-start" gap="8px">
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    marginTop: '8px',
                    flexShrink: 0,
                    backgroundColor: metric.color
                  }}
                />
                <Stack direction="column" gap="2px">
                  <Typography variant="body2Semibold">
                    {metric.title}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: theme.palette.vars.baseTextMedium }}
                  >
                    {metric.description}
                  </Typography>
                  {metric.path && (
                    <Typography
                      className="view-details"
                      variant="caption"
                      sx={{
                        color: theme.palette.vars.brandTextPrimary,
                        display: 'none'
                      }}
                    >
                      View details ›
                    </Typography>
                  )}
                </Stack>
              </Stack>
              <Typography
                variant="h5"
                sx={{ color: metric.color, flexShrink: 0 }}
              >
                {Math.round(metric.value)}%
              </Typography>
            </Stack>
          </Fragment>
        ))}
      </Stack>
    </Stack>
  );
};

export default ApplicationOverview;
