/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';
import {
  ApplicationOverview,
  ApplicationProtocolImpact,
  PageWithTitle,
  StaticTopology
} from '@/components';
import { useApplicationsIoC } from '@/api/scopeApi';
import { pageGradientBottomSx, pageGradientContentSx } from '@/common/styles';
import { PATHS } from '@/routes/routes.tsx';
import type { Application } from '@/types/scope.type';

const ApplicationDetails = () => {
  const theme = useTheme();
  const { applicationId } = useParams();

  const { data: applicationList } = useApplicationsIoC();
  const applicationDescription =
    applicationList?.applications.find(
      (application: Application) =>
        application.applicationName === applicationId
    )?.description ?? '';

  const breadcrumbItems = useMemo(
    () => [
      { text: 'Applications', link: PATHS.applications },
      {
        text: applicationId ?? '',
        link: PATHS.application.replace(
          ':applicationId',
          encodeURIComponent(applicationId ?? '')
        )
      }
    ],
    [applicationId]
  );

  return (
    <Box sx={pageGradientBottomSx}>
      <PageWithTitle
        title={
          <Stack direction={'column'} alignItems={'flex-start'} gap={'4px'}>
            <Typography
              variant={'h5'}
              sx={{
                color: theme.palette.vars.interactivePrimaryDefaultDefault
              }}
            >
              {applicationId ?? ''}
            </Typography>
            {applicationDescription && (
              <Typography variant={'body2'}>
                {applicationDescription}
              </Typography>
            )}
          </Stack>
        }
        breadcrumbItems={breadcrumbItems}
        sx={pageGradientContentSx}
      >
        <Stack direction={'column'} gap={'32px'} sx={{ height: '100%' }}>
          <ApplicationOverview applicationId={applicationId ?? ''} />
          <Stack direction={'column'} gap={'16px'}>
            <Stack direction={'column'} gap={'4px'}>
              <Typography
                variant={'captionSemibold'}
                sx={{ color: theme.palette.vars.baseTextWeak }}
              >
                COGNITION PROTOCOLS
              </Typography>
              <Typography variant={'h6'}>Protocol Impact</Typography>
            </Stack>
            <ApplicationProtocolImpact applicationId={applicationId ?? ''} />
          </Stack>
          <Stack direction={'column'} gap={'16px'} sx={{ flex: 1 }}>
            <Typography variant={'h6'}>Multi-agent system Topology</Typography>
            <Box
              sx={{
                flex: 1,
                minHeight: 500,
                width: '100%',
                maxWidth: '1260px',
                alignSelf: 'center',
                borderRadius: '8px'
              }}
            >
              <StaticTopology />
            </Box>
          </Stack>
        </Stack>
      </PageWithTitle>
    </Box>
  );
};

export default ApplicationDetails;
