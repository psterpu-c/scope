/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stack, Typography, useTheme } from '@mui/material';
import { Card, CardContent, Spinner } from '@open-ui-kit/core';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { useApplicationProtocolImpact } from '@/api/scopeApi';
import { useTimeRangeStore } from '@/store';
import { useDebouncedValue } from '@/utils';
import { getHealthScoreColor } from '@/utils/metrics';
import { CustomTooltip } from '../CustomTooltip';
import { SegmentedBar } from '../SegmentedBar';

export interface ApplicationProtocolImpactProps {
  applicationId: string;
}

export const ApplicationProtocolImpact = ({
  applicationId
}: ApplicationProtocolImpactProps) => {
  const theme = useTheme();
  const { startDate, endDate } = useTimeRangeStore();
  const debouncedStartDate = useDebouncedValue(startDate, 500);
  const debouncedEndDate = useDebouncedValue(endDate, 500);

  const { data, isLoading } = useApplicationProtocolImpact(
    applicationId,
    debouncedStartDate,
    debouncedEndDate
  );

  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ width: '100%', minHeight: 100 }}
      >
        <Spinner />
      </Stack>
    );
  }

  const metrics = data?.metrics ?? [];

  if (metrics.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" gap="16px" sx={{ width: '100%' }}>
      {metrics.map((metric) => (
        <Card
          key={metric.id}
          connector
          sx={{
            flex: '1 1 0',
            minWidth: 0,
            height: 'fit-content',
            padding: 0,
            border: 'none',
            outline: 'none',
            alignItems: 'flex-start',
            '& .MuiCardContent-root': {
              padding: '12px 16px 16px 16px !important'
            }
          }}
        >
          <CardContent sx={{ width: '100%' }}>
            <Stack direction="column" gap="8px" sx={{ width: '100%' }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.vars.baseTextMedium,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  {metric.protocol}
                </Typography>
                {metric.description && (
                  <CustomTooltip
                    title={
                      <Typography variant="caption">
                        {metric.description}
                      </Typography>
                    }
                    placement="top"
                    sx={{ maxWidth: '400px' }}
                  >
                    <InfoOutlineIcon
                      sx={{
                        width: '14px',
                        height: '14px',
                        cursor: 'pointer',
                        color: theme.palette.vars.baseTextMedium
                      }}
                    />
                  </CustomTooltip>
                )}
              </Stack>

              <Stack direction="column" gap="2px">
                <Typography variant="body2">{metric.name}</Typography>
                <Stack direction="row" alignItems="baseline" gap="2px">
                  <Typography variant="h5">
                    {Math.round(metric.value)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.vars.baseTextMedium }}
                  >
                    %
                  </Typography>
                </Stack>
              </Stack>

              <SegmentedBar
                value={metric.value}
                color={getHealthScoreColor(metric.value, theme)}
              />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default ApplicationProtocolImpact;
