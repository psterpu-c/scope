/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Divider, Stack } from '@open-ui-kit/core';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { CognitiveFailureMap, PageWithTitle } from '@/components';
import { pageGradientBottomSx, pageGradientContentSx } from '@/common/styles';
import { PATHS } from '@/routes/routes.tsx';

const ApplicationDetailsCognitiveFailureMap = () => {
  const { applicationId = '' } = useParams();
  const theme = useTheme();

  const encodedApplicationId = encodeURIComponent(applicationId);
  const applicationDetailsPath = useMemo(
    () => PATHS.application.replace(':applicationId', encodedApplicationId),
    [encodedApplicationId]
  );
  const cognitiveHealthPath = useMemo(
    () =>
      PATHS.applicationCognitiveHealth.replace(
        ':applicationId',
        encodedApplicationId
      ),
    [encodedApplicationId]
  );

  const breadcrumbItems = useMemo(
    () => [
      { text: 'Applications', link: PATHS.applications },
      { text: applicationId, link: applicationDetailsPath },
      { text: 'Cognitive Health', link: cognitiveHealthPath },
      {
        text: 'Cognitive Failure Map',
        link: PATHS.applicationCognitiveFailureMap.replace(
          ':applicationId',
          encodedApplicationId
        )
      }
    ],
    [
      applicationId,
      applicationDetailsPath,
      cognitiveHealthPath,
      encodedApplicationId
    ]
  );

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
              to={cognitiveHealthPath}
              variant="body2"
              sx={{
                color: theme.palette.vars.interactivePrimaryDefaultDefault,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {'< Back to Cognitive Health'}
            </Typography>
          </Stack>
        }
        breadcrumbItems={breadcrumbItems}
        sx={pageGradientContentSx}
      >
        <Stack direction="column" gap="16px" sx={{ width: '100%' }}>
          <Stack direction="column" gap="8px">
            <Typography variant="h5">Cognitive Failure Map</Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.vars.baseTextMedium }}
            >
              Explore all 19 cognitive challenges across three loci and four
              cognitive functions. Select a challenge to understand its
              mechanism, when to fix it, and its L9 response mapping.
            </Typography>
          </Stack>
          <Divider />
          <CognitiveFailureMap />
        </Stack>
      </PageWithTitle>
    </Box>
  );
};

export default ApplicationDetailsCognitiveFailureMap;
