/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router';
import { useMemo } from 'react';
import { SessionLatentSpace } from './SessionLatentSpace';
import { SessionMetricsWidgets } from './SessionMetricsWidgets';
import { transformLatentSpaceResponse } from '@/utils/latentSpace';
import {
  CognitiveFailuresBanner,
  CognitiveFailuresList,
  MetricSelectorDropdown,
  useMetricSelector,
  SingleSessionInsightsList
} from '@/components';
import {
  useImpactAssessmentSession,
  useSessionLatentSpace,
  useSessionsWithCognitiveObservability,
  useSessionStatefulEval
} from '@/api/scopeApi';
import { useTimeRangeStore } from '@/store';
import { compareFailures } from '@/common/cognitiveFailureConfidence';
import { Spinner } from '@open-ui-kit/core';
import { AgentImpactChart } from '../AgentImpactChart';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export const SessionAnalysisTab = () => {
  const { sessionId, applicationId } = useParams();
  const metricSelector = useMetricSelector();
  const { selectedMetricKeys } = metricSelector;

  const insightsEnabled = useFeatureFlag('insights');
  const impactAssessmentEnabled = useFeatureFlag('impact_assessment');
  const cognitiveObservabilityEnabled = useFeatureFlag(
    'cognitive_observability'
  );

  // The cognitive failures of the session. Without the feature flag the
  // application id is empty, which disables the request.
  const { startDate, endDate } = useTimeRangeStore();
  const {
    data: cognitiveSessions,
    isLoading: isCognitiveFailuresLoading,
    isError: isCognitiveFailuresError
  } = useSessionsWithCognitiveObservability(
    cognitiveObservabilityEnabled ? (applicationId ?? '') : '',
    startDate,
    endDate,
    sessionId
  );

  // Undefined while the session has no data. Highest confidence first.
  const cognitiveFailures = useMemo(() => {
    const session = cognitiveSessions?.sessions?.find(
      (s) => s.sessionId === sessionId
    );
    return session
      ? [...(session.cognitiveFailures ?? [])].sort(compareFailures)
      : undefined;
  }, [cognitiveSessions?.sessions, sessionId]);

  const {
    data: latentSpaceResponse,
    isLoading: isLatentSpaceLoading,
    error: latentSpaceError
  } = useSessionLatentSpace(sessionId ?? '');

  const sessionMetricsQuery = useSessionStatefulEval(sessionId ?? '');

  const {
    data: impactAssessmentSession,
    isLoading: isImpactAssessmentSessionLoading,
    error: impactAssessmentSessionError
  } = useImpactAssessmentSession(sessionId ?? '', impactAssessmentEnabled);

  const latentSpaceData = useMemo(() => {
    if (!latentSpaceResponse) return null;
    return transformLatentSpaceResponse(latentSpaceResponse);
  }, [latentSpaceResponse]);

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
    <Stack direction={'row'}>
      <Stack
        direction={'column'}
        gap={'32px'}
        sx={{ paddingTop: '16px', width: '100%', height: '100%' }}
      >
        {cognitiveObservabilityEnabled && (
          <CognitiveFailuresBanner
            failures={cognitiveFailures}
            isLoading={isCognitiveFailuresLoading}
            isError={isCognitiveFailuresError}
          />
        )}

        <MetricSelectorDropdown {...metricSelector} />

        <SessionMetricsWidgets metricKeys={selectedMetricKeys} />

        {cognitiveObservabilityEnabled && (
          <CognitiveFailuresList failures={cognitiveFailures} />
        )}

        {impactAssessmentEnabled &&
          (isImpactAssessmentSessionLoading ? (
            <Stack
              justifyContent={'center'}
              alignItems={'center'}
              sx={{ width: '100%', height: '300px' }}
            >
              <Spinner />
            </Stack>
          ) : impactAssessmentSessionError ? (
            <Typography color="text.secondary">
              An error occurred while loading impact distribution data.
            </Typography>
          ) : (
            <AgentImpactChart
              impactAssessmentData={impactAssessmentSession}
              selectedMetricKeys={selectedMetricKeys}
              title="Agent Impact on Session"
            />
          ))}

        {isLatentSpaceLoading ? (
          <Stack
            justifyContent={'center'}
            alignItems={'center'}
            sx={{ width: '100%', height: '100%' }}
          >
            <Spinner />
          </Stack>
        ) : latentSpaceError ? (
          <>An error occurred while loading latent space data!</>
        ) : latentSpaceData ? (
          <SessionLatentSpace
            data={latentSpaceData}
            title="Session Trajectory in Latent Space"
            width={900}
            height={500}
          />
        ) : (
          <Box sx={{ pt: 2, width: '100%', height: '100%' }}>
            <Typography color="text.secondary">
              No latent space data available for this session.
            </Typography>
          </Box>
        )}
      </Stack>
      {sessionId && insightsEnabled && (
        <SingleSessionInsightsList sessionId={sessionId} />
      )}
    </Stack>
  );
};
