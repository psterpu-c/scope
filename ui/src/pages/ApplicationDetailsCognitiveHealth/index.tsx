/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
  Card,
  Divider,
  GaugeChart,
  GeneralSize,
  Spinner,
  Stack,
  Tag,
  TagBackgroundColorVariants
} from '@open-ui-kit/core';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  ApplicationDetailsCognitiveFailures,
  DateInterval,
  IntervalPicker,
  PageWithTitle
} from '@/components';
import { useCognitiveHealthDetails } from '@/api/scopeApi';
import { pageGradientBottomSx, pageGradientContentSx } from '@/common/styles';
import { PATHS } from '@/routes/routes.tsx';
import { useOpenSessionDetails } from '@/hooks/useOpenSessionDetails';
import { useTimeRangeStore } from '@/store';
import { useDebouncedValue } from '@/utils';

// Gauge diameter in px (the open-ui-kit default is 132)
const GAUGE_SIZE = 132;
// 1 = the kit's default glow size; lower values shrink it.
const GAUGE_GLOW_SCALE = 0.4;

const ApplicationDetailsCognitiveHealth = () => {
  const { applicationId = '' } = useParams();
  const openSessionDetails = useOpenSessionDetails(
    applicationId,
    'Cognitive Health'
  );
  const theme = useTheme();
  const { startDate, endDate, setStartDate, setEndDate } = useTimeRangeStore();
  const debouncedStartDate = useDebouncedValue(startDate, 500);
  const debouncedEndDate = useDebouncedValue(endDate, 500);

  const { data, isLoading, isError, error } = useCognitiveHealthDetails(
    applicationId,
    debouncedStartDate,
    debouncedEndDate
  );

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
      { text: applicationId, link: applicationDetailsPath },
      {
        text: 'Cognitive Health',
        link: PATHS.applicationCognitiveHealth.replace(
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

    if (isError || !data) {
      return (
        <Stack gap="4px">
          <Typography color="error">
            Failed to load cognitive health.
          </Typography>
          <Typography variant="caption">
            {error instanceof Error ? error.message : ''}
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack direction="column" gap="16px" sx={{ width: '100%' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">Cognitive Health</Typography>
          <Typography
            component={RouterLink}
            to={PATHS.applicationCognitiveFailureMap.replace(
              ':applicationId',
              encodeURIComponent(applicationId)
            )}
            variant="captionSemibold"
            sx={{
              color: theme.palette.vars.neutralTextDefault,
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            Explore the cognitive failure map ↗
          </Typography>
        </Stack>

        <Divider />

        <Card
          sx={{
            position: 'relative',
            width: '100%',
            background: 'transparent'
          }}
        >
          <Tag
            color={TagBackgroundColorVariants.AccentFWeak}
            size={GeneralSize.Large}
            sx={{ position: 'absolute', top: '12px', right: '16px' }}
          >
            {data.status}
          </Tag>

          <Stack direction="row" alignItems="center" gap="32px">
            <Stack
              direction="column"
              alignItems="center"
              gap="4px"
              sx={{
                // The kit renders the ambient glow as the first child of the
                // gauge wrapper and doesn't expose its size, so shrink it here.
                // The kit's own transform (centering + downward offset) is
                // re-declared with the scale appended, so the centering isn't
                // scaled along with the glow. `!important` is needed because
                // the kit sets the transform as an inline style.
                '& .recharts-responsive-container > div > div:first-of-type': {
                  transform: `translate(-50%, calc(-50% + ${GAUGE_SIZE * (44 / 171.704)}px)) scale(${GAUGE_GLOW_SCALE}) !important`
                }
              }}
            >
              <GaugeChart
                variant="amber"
                data={[
                  {
                    name: 'Cognitive Health',
                    value: data.score
                  }
                ]}
                styleProps={{
                  customWidth: GAUGE_SIZE,
                  customHeight: GAUGE_SIZE
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: theme.palette.vars.baseTextMedium }}
              >
                Cognitive Health
              </Typography>
            </Stack>

            <Stack direction="column" gap="8px">
              <Typography variant="body2Semibold">
                {`${data.status} · ${data.detectedFailurePatterns} of ${data.totalFailurePatterns} failure patterns detected.`}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.vars.baseTextMedium }}
              >
                {data.description}
              </Typography>
            </Stack>
          </Stack>
        </Card>

        <ApplicationDetailsCognitiveFailures
          applicationId={applicationId}
          onSessionClick={openSessionDetails}
          startTime={debouncedStartDate}
          endTime={debouncedEndDate}
          failurePatterns={data.failurePatterns}
        />
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
            justifyContent="flex-end"
          >
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
        </Stack>
      </PageWithTitle>
    </Box>
  );
};

export default ApplicationDetailsCognitiveHealth;
