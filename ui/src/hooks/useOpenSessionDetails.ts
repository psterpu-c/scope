/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '@/routes/routes.tsx';

// Where the "Back to ..." link of the session details page leads to.
export interface SessionDetailsBackTo {
  path: string;
  label: string;
}

export interface SessionDetailsLocationState {
  backTo?: SessionDetailsBackTo;
}

// Returns a handler that opens the details page of a session. The page the
// user comes from is passed along, for the "Back to ..." link.
export const useOpenSessionDetails = (
  applicationId: string,
  backLabel: string
) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(
    (session: { sessionId: string }) => {
      const state: SessionDetailsLocationState = {
        backTo: { path: pathname, label: backLabel }
      };
      navigate(
        PATHS.applicationSessionDetails
          .replace(':applicationId', encodeURIComponent(applicationId))
          .replace(':sessionId', encodeURIComponent(session.sessionId)),
        { state }
      );
    },
    [navigate, pathname, applicationId, backLabel]
  );
};
