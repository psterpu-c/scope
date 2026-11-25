/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Stack } from '@open-ui-kit/core';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import { PageWithTitle, SessionMetrics } from '@/components';
import { ConversationTab } from '@/components/SessionDetails/ConversationTab';
import { pageGradientBottomSx, pageGradientContentSx } from '@/common/styles';
import { PATHS } from '@/routes/routes.tsx';
import { SessionDetailsLocationState } from '@/hooks/useOpenSessionDetails';

const SessionDetails = () => {
  const { applicationId = '', sessionId = '' } = useParams();
  const theme = useTheme();
  const location = useLocation();
  const applicationDetailsPath = useMemo(
    () =>
      PATHS.application.replace(
        ':applicationId',
        encodeURIComponent(applicationId)
      ),
    [applicationId]
  );

  // The page the user comes from, falls back to the application details.
  const backTo = (location.state as SessionDetailsLocationState | null)
    ?.backTo ?? { path: applicationDetailsPath, label: applicationId };

  const breadcrumbItems = useMemo(
    () => [
      { text: 'Applications', link: PATHS.applications },
      { text: applicationId, link: applicationDetailsPath },
      { text: sessionId, link: location.pathname }
    ],
    [applicationId, applicationDetailsPath, sessionId, location.pathname]
  );

  return (
    <Box sx={pageGradientBottomSx}>
      <PageWithTitle
        title={
          <Stack
            direction="row"
            gap="4px"
            sx={{ marginTop: '16px' }}
            justifyContent="space-between"
          >
            <Typography
              variant="h5"
              sx={{ color: theme.palette.vars.controlIconStrong }}
            >
              {sessionId}
            </Typography>
            <Typography
              component={RouterLink}
              to={backTo.path}
              variant="body2"
              sx={{
                color: theme.palette.vars.interactivePrimaryDefaultDefault,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {`< Back to ${backTo.label}`}
            </Typography>
          </Stack>
        }
        breadcrumbItems={breadcrumbItems}
        sx={pageGradientContentSx}
      >
        {/* Both read the session id from the route params */}
        <Stack direction="column" gap="24px" sx={{ width: '100%' }}>
          <SessionMetrics />
          <ConversationTab />
        </Stack>
      </PageWithTitle>
    </Box>
  );
};

export default SessionDetails;
