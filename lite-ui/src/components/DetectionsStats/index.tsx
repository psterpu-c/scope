/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Box, Stack, Typography } from '@open-ui-kit/core';
import { useSessionsWithCognitiveFailures } from '@/api/scopeApi';
import { CognitiveFailurePattern } from '@/types/scope.type';

export interface DetectionsStatsProps {
  applicationId: string;
  startTime: number;
  endTime: number;
  pattern: CognitiveFailurePattern;
  borderColor: string;
  mutedText: string;
}

// Impacted sessions of the pattern, and the detections and risks summed up from
// all of these sessions. The sessions are the ones of the impacted sessions
// table (same query, so they are fetched once).
export const DetectionsStats = ({
  applicationId,
  startTime,
  endTime,
  pattern,
  borderColor,
  mutedText
}: DetectionsStatsProps) => {
  const { data: sessions, isLoading } = useSessionsWithCognitiveFailures(
    applicationId,
    startTime,
    endTime,
    pattern.code,
    pattern.impactedSessionCount
  );

  const totals = useMemo(
    () => ({
      detections: (sessions ?? []).reduce((sum, s) => sum + s.detections, 0),
      risks: (sessions ?? []).reduce((sum, s) => sum + s.risks, 0)
    }),
    [sessions]
  );

  const stats = [
    { label: 'Impacted sessions', value: pattern.impactedSessionCount },
    { label: 'Total detections', value: isLoading ? '—' : totals.detections },
    { label: 'Total risks', value: isLoading ? '—' : totals.risks }
  ];

  return (
    <Stack
      direction="row"
      sx={{
        border: `1px solid ${borderColor}`,
        borderRadius: '8px'
      }}
    >
      {stats.map((stat, index) => (
        <Box
          key={stat.label}
          sx={{
            flex: '1 1 0',
            padding: '12px 16px',
            borderLeft: index === 0 ? 'none' : `1px solid ${borderColor}`
          }}
        >
          <Typography variant="h5">{stat.value}</Typography>
          <Typography variant="captionSemibold" sx={{ color: mutedText }}>
            {stat.label}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

export default DetectionsStats;
