/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Typography, useTheme } from '@mui/material';
import { format } from 'date-fns';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
  YAxisProps
} from 'recharts';
import { Unit } from '@/types/scope.type';
import { formatMetricValueLineChartTooltip } from '@/utils/metrics';

interface MetricScatterChartProps {
  // `date` is an ISO date string, the other key is the metric value.
  data: { date: string; [key: string]: number | string }[];
  metricKey: string;
  metricName: string;
  yAxisProps?: YAxisProps;
  color?: string;
  unit?: Unit;
}

export const MetricScatterChart = ({
  data,
  metricKey,
  metricName,
  yAxisProps,
  color,
  unit
}: MetricScatterChartProps) => {
  const theme = useTheme();
  const pointColor =
    color ?? theme.palette.vars.interactivePrimaryDefaultDefault;
  const axisColor = theme.palette.vars.baseTextWeak;

  const points = data.map((item) => ({
    time: new Date(item.date).getTime(),
    value: Number(item[metricKey])
  }));

  const renderTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload as { time: number; value: number };
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.vars.baseBackgroundWeak,
          border: `1px solid ${theme.palette.vars.baseBorderDefault}`,
          borderRadius: '4px',
          padding: '8px',
          color: theme.palette.vars.baseTextStrong
        }}
      >
        <Typography variant="caption" component="div">
          {format(new Date(point.time), 'yyyy-MM-dd HH:mm:ss')}
        </Typography>
        <Typography variant="body2">
          {metricName}:{' '}
          {formatMetricValueLineChartTooltip(point.value, unit ?? Unit.Scalar)}
        </Typography>
      </Box>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid
          strokeDasharray="4 4"
          stroke={theme.palette.vars.baseBorderWeak}
        />
        <XAxis
          type="number"
          dataKey="time"
          name="Timestamp"
          domain={['dataMin', 'dataMax']}
          tick={false}
          tickLine={false}
          height={28}
          label={{
            value: 'Timestamp',
            position: 'insideBottom',
            offset: 0,
            fill: axisColor,
            fontSize: 12
          }}
          stroke={theme.palette.vars.baseBorderDefault}
        />
        <YAxis
          type="number"
          dataKey="value"
          name={metricName}
          tick={{ fill: axisColor, fontSize: 12 }}
          stroke={theme.palette.vars.baseBorderDefault}
          {...yAxisProps}
        />
        <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '4 4' }} />
        <Scatter data={points} fill={pointColor} />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default MetricScatterChart;
