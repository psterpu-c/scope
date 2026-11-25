/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, useTheme } from '@mui/material';

export interface SegmentedBarProps {
  /** 0-100 */
  value: number;
  /** Number of segments the bar is split into */
  segments?: number;
  /** Color of the filled segments */
  color?: string;
  /** Height of each segment, in px */
  height?: number;
  /** Gap between segments, in px */
  gap?: number;
}

const DEFAULT_COLOR = '#4FB8C0';

export const SegmentedBar = ({
  value,
  segments = 48,
  color = DEFAULT_COLOR,
  height = 8,
  gap = 2
}: SegmentedBarProps) => {
  const theme = useTheme();
  const clamped = Math.min(100, Math.max(0, value));
  const filledSegments = Math.round((clamped / 100) * segments);

  return (
    <Box
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      sx={{
        display: 'flex',
        width: '100%',
        gap: `${gap}px`
      }}
    >
      {Array.from({ length: segments }).map((_, index) => (
        <Box
          key={index}
          sx={{
            flex: 1,
            minWidth: 0,
            height: `${height}px`,
            borderRadius: '1px',
            backgroundColor:
              index < filledSegments
                ? color
                : theme.palette.vars.baseBorderMedium,
            transition: 'background-color 0.3s ease-in-out'
          }}
        />
      ))}
    </Box>
  );
};

export default SegmentedBar;
