/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { Dashboard as ApplicationsIcon } from '@/assets/icons';

import LayoutWithSideNav from '@/components/LayoutWithSideNav/LayoutWithSideNav';

import Four0Four from '@/pages/404/404';
import { AppRoute } from '@/routes/types.ts';
import Applications from '@/pages/Applications';
import ApplicationDetails from '@/pages/ApplicationDetails';
import ApplicationDetailsQuality from '@/pages/ApplicationDetailsQuality';
import ApplicationDetailsPerformance from '@/pages/ApplicationDetailsPerformance';
import ApplicationDetailsCognitiveHealth from '@/pages/ApplicationDetailsCognitiveHealth';
import ApplicationDetailsCognitiveFailureMap from '@/pages/ApplicationDetailsCognitiveFailureMap';
import AgentDetailsPopulation from '@/pages/AgentDetailsPopulation';
import { agentDetailsRoutes } from '@/pages/AgentDetailsPopulation/AgentDetailsSideBarItemList.tsx';
export const PATHS = {
  applications: '/applications',
  application: '/applications/:applicationId',
  applicationQuality: '/applications/:applicationId/quality',
  applicationPerformance: '/applications/:applicationId/performance',
  applicationCognitiveHealth: '/applications/:applicationId/cognitive-health',
  applicationCognitiveFailureMap:
    '/applications/:applicationId/cognitive-health/failure-map',
  agent: '/applications/:applicationId/agents/:agentId',
  applicationOverview: '/applications/:applicationId/overview',
  applicationCollectSession: '/applications/:applicationId/collect/:sessionId',
  applicationCollectSessionTab:
    '/applications/:applicationId/collect/:sessionId/:sessionTab',
  applicationCollectLiveSession:
    '/applications/:applicationId/collect/live/:liveSessionId',
  applicationCollect: '/applications/:applicationId/collect',
  applicationCollectCompleted: '/applications/:applicationId/collect/completed',
  applicationCollectLiveSessions:
    '/applications/:applicationId/collect/live-sessions',
  applicationAnalyze: '/applications/:applicationId/analyze',
  applicationAnalyzeOverview: '/applications/:applicationId/analyze/overview',
  applicationAnalyzeOverviewSemanticGroup:
    '/applications/:applicationId/analyze/overview/:semanticGroup',
  applicationMonitor: '/applications/:applicationId/monitor',
  applicationMonitorSubTab: '/applications/:applicationId/monitor/:monitorTab',

  agentCollectSession:
    '/applications/:applicationId/agents/:agentId/collect/:sessionId',
  agentCollectSessionTab:
    '/applications/:applicationId/agents/:agentId/collect/:sessionId/:sessionTab',

  controlPanel: '/control-panel',
  kgInspector: '/kg-inspector',
  kgInspectorG6: '/g6-kg-inspector'
};

export const SETTINGS_PATHS = {};

export const DEFAULT_PATH = PATHS.applications;

export const settingsRoute = {};

export const routes: {
  authenticated: AppRoute[];
  unauthenticated: AppRoute[];
} = {
  authenticated: [
    {
      name: 'Default',
      path: '/',
      element: <Navigate to={DEFAULT_PATH} />
    },
    {
      name: 'Applications',
      path: PATHS.applications,
      element: <Outlet />,
      sideBarProps: {
        title: 'Applications',
        icon: ApplicationsIcon
      },
      children: [
        {
          name: 'ApplicationsIndex',
          path: '',
          element: <Applications />
        },
        {
          name: 'Application',
          path: PATHS.application,
          element: <ApplicationDetails />
        },
        {
          name: 'ApplicationQuality',
          path: PATHS.applicationQuality,
          element: <ApplicationDetailsQuality />
        },
        {
          name: 'ApplicationPerformance',
          path: PATHS.applicationPerformance,
          element: <ApplicationDetailsPerformance />
        },
        {
          name: 'ApplicationCognitiveHealth',
          path: PATHS.applicationCognitiveHealth,
          element: <ApplicationDetailsCognitiveHealth />
        },
        {
          name: 'ApplicationCognitiveFailureMap',
          path: PATHS.applicationCognitiveFailureMap,
          element: <ApplicationDetailsCognitiveFailureMap />
        },
        {
          name: 'ApplicationTab',
          path: '/applications/:applicationId/:tab',
          element: <ApplicationDetails />
        },
        {
          name: 'ApplicationCollectCompleted',
          path: PATHS.applicationCollectCompleted,
          element: <ApplicationDetails />
        },
        {
          name: 'ApplicationCollectLiveSessions',
          path: PATHS.applicationCollectLiveSessions,
          element: <ApplicationDetails />
        },
        {
          name: 'ApplicationCollectLiveSession',
          path: PATHS.applicationCollectLiveSession,
          element: <ApplicationDetails />
        },
        {
          name: 'ApplicationCollectSessionTab',
          path: PATHS.applicationCollectSessionTab,
          element: <ApplicationDetails />
        },
        {
          name: 'ApplicationCollectSession',
          path: PATHS.applicationCollectSession,
          element: <ApplicationDetails />
        },
        {
          name: 'ApplicationMonitorSubTab',
          path: '/applications/:applicationId/monitor/:monitorTab',
          element: <ApplicationDetails />
        },
        {
          name: 'ApplicationAnalyzeSubTab',
          path: '/applications/:applicationId/analyze/:analyzeTab',
          element: <ApplicationDetails />
        },
        {
          name: 'ApplicationAnalyzeSemanticGroup',
          path: '/applications/:applicationId/analyze/:analyzeTab/:semanticGroup',
          element: <ApplicationDetails />
        },
        {
          name: 'AgentDetails',
          path: PATHS.agent,
          element: <AgentDetailsPopulation />,
          children: agentDetailsRoutes
        }
      ]
    }
  ],
  unauthenticated: []
};

export const unauthenticatedRoutes = routes.unauthenticated;
export const authenticatedRoutes = routes.authenticated;
export const allRoutes = [...routes.unauthenticated, ...routes.authenticated];

const renderRoute = (route: AppRoute) => (
  <Route key={route.name} path={route.path} element={route.element}>
    {route.children?.map(renderRoute)}
  </Route>
);

const registerRoutes = () => (
  <Routes>
    <Route path="/" element={<LayoutWithSideNav />}>
      {[...unauthenticatedRoutes, ...authenticatedRoutes].map(renderRoute)}
    </Route>
    <Route path="*" element={<Four0Four />} />
  </Routes>
);

const appRoutes = registerRoutes();
export default appRoutes;
