/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stack, Typography } from '@open-ui-kit/core';
import { format } from 'date-fns';

const DATE_FORMAT = 'MMM d, yyyy HH:mm:ss';

export interface DateIntervalProps {
  // Epoch seconds
  startTime: number;
  endTime: number;
}

// The selected time interval, e.g. "Jul 17, 2025 10:00:00 - Jul 18, 2025 10:00:00"
export const DateInterval = ({ startTime, endTime }: DateIntervalProps) => (
  <Stack direction="row" gap={'8px'} alignItems={'center'}>
    <Typography variant={'body2Semibold'}>
      {format(new Date(startTime * 1000), DATE_FORMAT)}
    </Typography>
    <Typography variant={'body2Semibold'}>-</Typography>
    <Typography variant={'body2Semibold'}>
      {format(new Date(endTime * 1000), DATE_FORMAT)}
    </Typography>
  </Stack>
);
