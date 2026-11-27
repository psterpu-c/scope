/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQuery } from '@tanstack/react-query';
import {
  ApplicationSessions,
  SessionWithStatefulEval,
  StaticTopology,
  ApplicationSummaryMetrics,
  CognitiveHealth,
  CognitiveHealthDetails,
  CognitiveFailureImpactedSession,
  CognitiveFailurePattern,
  ApplicationProtocolImpact,
  SessionStatefulEval
} from '@/types/scope.type';
import {
  ApplicationsResponse,
  ApplicationsIoCResponse
} from '@/types/scopeApi.type';

const OCE_API_BASE_URL = window.restApiUrl ?? import.meta.env.VITE_REST_API_URL;
// const OCE_API_BASE_URL = 'http://localhost:8000/api/v1';

// const OCE_API_BASE_URL_DEV = 'http://localhost:10000';

const fetchApplications = async (): Promise<ApplicationsResponse> => {
  const response = await fetch(`${OCE_API_BASE_URL}/ui/applications`);

  if (!response.ok) {
    throw new Error(`Failed to fetch applications: ${response.statusText}`);
  }

  const data = await response.json();

  return data;
};

// Mocked applications endpoint: the applications with their `detections` and
// `risks` counts and `healthScore`. Fetches the real applications and adds the
// three fields.
// TODO: replace with a real endpoint (proposed: GET /ui/applications-overview).
const fetchApplicationsIoC = async (): Promise<ApplicationsIoCResponse> => {
  const { applications } = await fetchApplications();

  return {
    applications: applications.map((application) => {
      const hash = hashString(application.applicationName);
      // The health score is the average of the quality, performance and
      // cognitive health scores (mocked here).
      const quality = hash % 101;
      const performance = (hash >>> 4) % 101;
      const cognitiveHealth = (hash >>> 8) % 101;
      return {
        ...application,
        detections: hash % 40,
        risks: (hash >>> 3) % 120,
        healthScore: Math.round((quality + performance + cognitiveHealth) / 3)
      };
    })
  };
};

export const useApplicationsIoC = () => {
  return useQuery<ApplicationsIoCResponse>({
    queryKey: ['applicationsIoC'],
    queryFn: () => fetchApplicationsIoC()
  });
};

const fetchApplicationSessionsWithStatefulEval = async (
  applicationId: string,
  startTime: number,
  endTime: number,
  semanticGroupId?: string
): Promise<ApplicationSessions> => {
  const params = new URLSearchParams({
    start_time: String(startTime),
    end_time: String(endTime)
  });
  if (semanticGroupId) {
    params.set('semantic_group_id', semanticGroupId);
  }

  const response = await fetch(
    `${OCE_API_BASE_URL}/applications/${applicationId}/sessions_with_stateful_eval?${params}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch application sessions with stateful eval: ${response.statusText}`
    );
  }

  const data = await response.json();

  return data;
};

const fetchSessionStatefulEval = async (
  sessionId: string
): Promise<SessionStatefulEval> => {
  const response = await fetch(
    `${OCE_API_BASE_URL}/metrics/sessions/${sessionId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch session stateful eval: ${response.statusText}`
    );
  }

  const data = await response.json();

  return data;
};

export const useSessionStatefulEval = (sessionId: string) => {
  return useQuery<SessionStatefulEval>({
    queryKey: ['sessionStatefulEval', sessionId],
    queryFn: () => fetchSessionStatefulEval(sessionId)
  });
};

export const fetchStaticTopology = async (
  applicationId: string
): Promise<StaticTopology> => {
  const response = await fetch(
    `${OCE_API_BASE_URL}/applications/${applicationId}/topology`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch static topology: ${response.statusText}`);
  }

  const data = await response.json();

  return data;
};

export const useStaticTopology = (applicationId: string) => {
  return useQuery<StaticTopology>({
    queryKey: ['staticTopology', applicationId],
    queryFn: () => fetchStaticTopology(applicationId)
  });
};

export interface AgentToolItem {
  name: string;
  description: string | null;
}

export interface ApplicationAgentTools {
  agent_id: string;
  agent_name: string;
  agent_description: string | null;
  tools: AgentToolItem[];
}

export interface ApplicationAgentToolsResponse {
  application_id: string;
  agents: ApplicationAgentTools[];
}

export const fetchApplicationAgentTools = async (
  applicationId: string
): Promise<ApplicationAgentToolsResponse> => {
  const response = await fetch(
    `${OCE_API_BASE_URL}/applications/${applicationId}/agent-tools`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch agent tools: ${response.statusText}`);
  }

  return response.json();
};

export const useApplicationAgentTools = (applicationId: string) => {
  return useQuery<ApplicationAgentToolsResponse>({
    queryKey: ['applicationAgentTools', applicationId],
    queryFn: () => fetchApplicationAgentTools(applicationId),
    enabled: !!applicationId
  });
};

export const fetchApplicationSummaryMetrics = async (
  applicationId: string,
  startTime?: number,
  endTime?: number
): Promise<ApplicationSummaryMetrics> => {
  const params = new URLSearchParams();
  if (startTime !== undefined) params.set('start_time', String(startTime));
  if (endTime !== undefined) params.set('end_time', String(endTime));
  const query = params.toString();

  const response = await fetch(
    `${OCE_API_BASE_URL}/metrics/applications/${applicationId}/summary${
      query ? `?${query}` : ''
    }`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch application summary metrics: ${response.statusText}`
    );
  }

  const data = await response.json();

  return { applicationName: applicationId, ...data };
};

export const useApplicationSummaryMetrics = (
  applicationId: string,
  startTime?: number,
  endTime?: number
) => {
  return useQuery<ApplicationSummaryMetrics>({
    queryKey: ['applicationSummaryMetrics', applicationId, startTime, endTime],
    queryFn: () =>
      fetchApplicationSummaryMetrics(applicationId, startTime, endTime)
  });
};

// TODO: replace with a real endpoint once the backend exposes cognitive health.
const fetchCognitiveHealth = async (
  applicationId: string,
  _startTime?: number,
  _endTime?: number
): Promise<CognitiveHealth> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    applicationName: applicationId,
    score: 28,
    description:
      'Agents are dropping details, skipping checks, and sometimes acting on conflicting trip plans.'
  };
};

export const useCognitiveHealth = (
  applicationId: string,
  startTime?: number,
  endTime?: number
) => {
  return useQuery<CognitiveHealth>({
    queryKey: ['cognitiveHealth', applicationId, startTime, endTime],
    queryFn: () => fetchCognitiveHealth(applicationId, startTime, endTime)
  });
};

// Small stable string hash, to derive mocked values from real session ids.
const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

// Keeps only the columns of the cognitive failure sessions tables.
// TODO: the cognition protocols, detections and risks are mocked (derived from
// the session id), use the real ones once the sessions endpoint returns them.
const toCognitiveFailureSession = (
  session: SessionWithStatefulEval
): CognitiveFailureImpactedSession => {
  const hash = hashString(session.sessionId);
  return {
    sessionId: session.sessionId,
    timestamp: session.timestamp,
    cost: session.cost,
    agents: session.agents,
    llms: session.llms,
    tokens: session.tokens,
    duration: session.duration,
    detections: hash % 6,
    risks: (hash >>> 3) % 12,
    cognitionProtocols: [
      { protocol: 'L9-CONCORD', enabled: true, activated: hash % 2 === 0 },
      { protocol: 'L9-ACCORD', enabled: true, activated: hash % 3 !== 0 }
    ]
  };
};

// Mock data helpers for the cognitive health details.
// TODO: remove together with the mocked endpoint below.
const buildMockFailurePattern = (
  pattern: Omit<
    CognitiveFailurePattern,
    'impactedSessionCount' | 'totalAlerts' | 'traceCount' | 'spanCount'
  >,
  sessionCount: number,
  seed: number
): CognitiveFailurePattern => {
  return {
    ...pattern,
    impactedSessionCount: sessionCount,
    totalAlerts: sessionCount + (seed % 3),
    traceCount: sessionCount,
    spanCount: sessionCount * 20
  };
};

// TODO: replace with a real endpoint once the backend exposes cognitive health details.
const fetchCognitiveHealthDetails = async (
  applicationId: string,
  _startTime?: number,
  _endTime?: number
): Promise<CognitiveHealthDetails> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const failurePatterns: CognitiveFailurePattern[] = [
    buildMockFailurePattern(
      {
        code: 'IR-1',
        level: 'individual',
        category: 'Representational',
        confidence: 'high',
        agentsInvolved: 1,
        reasoning:
          'The travel plan starts with several constraints, but later steps preserve the destination while dropping details such as trip length, fare limits, or required stops.',
        protocolResponse: {
          protocol: 'ACCORD',
          title: 'Lock the shared request',
          description:
            "Accord turns the traveler's request into a shared intent contract so each agent keeps the same destinations, dates, and constraints. The final response is checked against the locked request before it is returned."
        }
      },
      3,
      1
    ),
    buildMockFailurePattern(
      {
        code: 'IC-1',
        level: 'individual',
        category: 'Coordinative',
        confidence: 'medium',
        agentsInvolved: 1,
        reasoning:
          'The agent commits to booking the cheapest fare, but a follow-up question about baggage options pulls it away from the commitment and the original goal is never resumed.',
        protocolResponse: {
          protocol: 'ACCORD',
          title: 'Keep commitments visible',
          description:
            'Accord records each commitment as an open obligation and reminds the agent of it until it is fulfilled or explicitly cancelled.'
        }
      },
      4,
      2
    ),
    buildMockFailurePattern(
      {
        code: 'IE-1',
        level: 'individual',
        category: 'Epistemic',
        confidence: 'medium',
        agentsInvolved: 1,
        reasoning:
          'The agent states fare availability with full confidence although no live availability lookup was performed in the session.',
        protocolResponse: {
          protocol: 'CONCORD',
          title: 'Require evidence for claims',
          description:
            'Concord asks the agent to attach the source of each factual claim and flags answers that are not backed by a tool result.'
        }
      },
      5,
      3
    ),
    buildMockFailurePattern(
      {
        code: 'IC-2',
        level: 'individual',
        category: 'Coordinative',
        confidence: 'low',
        agentsInvolved: 1,
        reasoning:
          'After the traveler changes the departure date, the agent keeps executing the original itinerary instead of revising the plan.',
        protocolResponse: {
          protocol: 'ACCORD',
          title: 'Re-plan on changed context',
          description:
            'Accord detects changes to the locked request and triggers a plan revision before the next step is executed.'
        }
      },
      6,
      4
    ),
    buildMockFailurePattern(
      {
        code: 'DR-1',
        level: 'dyadic',
        category: 'Representational',
        confidence: 'high',
        agentsInvolved: 2,
        reasoning:
          'The planner and the booking agent both use "flexible dates", but the planner means ±3 days while the booking agent treats it as any date in the month.',
        protocolResponse: {
          protocol: 'CONCORD',
          title: 'Share a common vocabulary',
          description:
            'Concord attaches shared definitions to the terms exchanged between agents so that both sides resolve them the same way.'
        }
      },
      3,
      5
    ),
    buildMockFailurePattern(
      {
        code: 'DC-4',
        level: 'dyadic',
        category: 'Coordinative',
        confidence: 'high',
        agentsInvolved: 2,
        reasoning:
          'Hotel questions are delegated to the flights agent because its model of peer capabilities is outdated.',
        protocolResponse: {
          protocol: 'CONCORD',
          title: 'Advertise agent capabilities',
          description:
            'Concord keeps a verified capability registry so tasks are delegated to the peer that can actually perform them.'
        }
      },
      4,
      6
    ),
    buildMockFailurePattern(
      {
        code: 'DE-1',
        level: 'dyadic',
        category: 'Epistemic',
        confidence: 'medium',
        agentsInvolved: 2,
        reasoning:
          'A pricing query is routed to the itinerary agent, which does not hold fare data, and its reply is trusted over the pricing agent.',
        protocolResponse: {
          protocol: 'CONCORD',
          title: 'Route by knowledge ownership',
          description:
            'Concord tracks which agent owns which knowledge and routes queries, and weighs replies, accordingly.'
        }
      },
      5,
      7
    ),
    buildMockFailurePattern(
      {
        code: 'DC-3',
        level: 'dyadic',
        category: 'Coordinative',
        confidence: 'medium',
        agentsInvolved: 2,
        reasoning:
          'The agents exchange fare preferences for several turns but never issue a binding proposal, so no booking obligation is created.',
        protocolResponse: {
          protocol: 'ACCORD',
          title: 'Turn positions into proposals',
          description:
            'Accord requires negotiations to end in an explicit proposal that both agents accept or reject.'
        }
      },
      6,
      8
    ),
    buildMockFailurePattern(
      {
        code: 'CR-1',
        level: 'collective',
        category: 'Representational',
        confidence: 'high',
        agentsInvolved: 3,
        reasoning:
          'Each agent starts from a different reading of the request: one optimizes for price, another for travel time, and the third for loyalty points.',
        protocolResponse: {
          protocol: 'ACCORD',
          title: 'Agree on the task first',
          description:
            'Accord has the team confirm a single task definition before any agent starts working on it.'
        }
      },
      3,
      9
    ),
    buildMockFailurePattern(
      {
        code: 'CC-2',
        level: 'collective',
        category: 'Coordinative',
        confidence: 'medium',
        agentsInvolved: 3,
        reasoning:
          'No mechanism lets the agents hold the trip goal jointly, so each pursues its own sub-goal and the combined result misses the budget.',
        protocolResponse: {
          protocol: 'ACCORD',
          title: 'Hold the goal together',
          description:
            'Accord maintains a shared goal state that every agent reads and updates, so sub-goals stay aligned with the collective goal.'
        }
      },
      4,
      10
    ),
    buildMockFailurePattern(
      {
        code: 'CC-3',
        level: 'collective',
        category: 'Coordinative',
        confidence: 'low',
        agentsInvolved: 3,
        reasoning:
          'The orchestrator returns a final itinerary without reconciling the conflicting hotel and flight results from its sub-agents.',
        protocolResponse: {
          protocol: 'CONCORD',
          title: 'Reconcile before committing',
          description:
            'Concord blocks the final answer until conflicts between sub-agent results are resolved or surfaced.'
        }
      },
      5,
      11
    ),
    buildMockFailurePattern(
      {
        code: 'CE-1',
        level: 'collective',
        category: 'Epistemic',
        confidence: 'medium',
        agentsInvolved: 4,
        reasoning:
          'The team commits to a confident itinerary without a collective checking step, even though two agents reported different arrival times.',
        protocolResponse: {
          protocol: 'CONCORD',
          title: 'Verify as a team',
          description:
            'Concord adds a collective verification step that checks the final output against every agent’s findings.'
        }
      },
      6,
      12
    )
  ];

  return {
    applicationName: applicationId,
    score: 28,
    status: 'Weak',
    detectedFailurePatterns: failurePatterns.length,
    totalFailurePatterns: 19,
    description:
      'Agents are losing details, skipping checks, or acting on conflicting trip plans. Select a pattern to inspect its affected sessions and the L9 response.',
    failurePatterns
  };
};

export const useCognitiveHealthDetails = (
  applicationId: string,
  startTime?: number,
  endTime?: number
) => {
  return useQuery<CognitiveHealthDetails>({
    queryKey: ['cognitiveHealthDetails', applicationId, startTime, endTime],
    queryFn: () =>
      fetchCognitiveHealthDetails(applicationId, startTime, endTime)
  });
};

// Sessions of the application (sessions with stateful eval endpoint), reduced
// to the columns of the cognitive failure sessions tables.
export const useSessionsIoC = (
  applicationId: string,
  startTime: number,
  endTime: number
) => {
  return useQuery<CognitiveFailureImpactedSession[]>({
    queryKey: ['sessionsIoC', applicationId, startTime, endTime],
    queryFn: async () => {
      const data = await fetchApplicationSessionsWithStatefulEval(
        applicationId,
        startTime,
        endTime
      );
      return (data.sessionList ?? []).map(toCognitiveFailureSession);
    }
  });
};

// Sessions impacted by a cognitive failure pattern: the sessions of the
// application (sessions with stateful eval endpoint), reduced to the table
// columns.
// TODO: the backend doesn't link sessions to failure patterns yet. Until then
// a stable subset of `limit` sessions is picked per failure code.
export const useSessionsWithCognitiveFailures = (
  applicationId: string,
  startTime: number,
  endTime: number,
  failureCode: string,
  limit: number
) => {
  return useQuery<CognitiveFailureImpactedSession[]>({
    queryKey: [
      'sessionsWithCognitiveFailures',
      applicationId,
      startTime,
      endTime,
      failureCode,
      limit
    ],
    queryFn: async () => {
      const data = await fetchApplicationSessionsWithStatefulEval(
        applicationId,
        startTime,
        endTime
      );
      return (data.sessionList ?? [])
        .map((session) => ({
          session,
          rank: hashString(`${failureCode}:${session.sessionId}`)
        }))
        .sort((a, b) => a.rank - b.rank)
        .slice(0, limit)
        .map(({ session }) => toCognitiveFailureSession(session));
    }
  });
};

// TODO: replace with a real endpoint once the backend exposes protocol impact.
const fetchApplicationProtocolImpact = async (
  applicationId: string,
  _startTime?: number,
  _endTime?: number
): Promise<ApplicationProtocolImpact> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    applicationName: applicationId,
    metrics: [
      {
        id: 'concord-mean-satisfaction',
        protocol: 'CONCORD',
        name: 'Mean Satisfaction',
        value: 26,
        description:
          'Average satisfaction score across sessions where the Concord protocol was active.'
      },
      {
        id: 'concord-score-fairness',
        protocol: 'CONCORD',
        name: 'Score Fairness',
        value: 42,
        description:
          'How evenly satisfaction is distributed between the agents taking part in Concord negotiations.'
      },
      {
        id: 'accord-glossary-uptake',
        protocol: 'ACCORD',
        name: 'Glossary Uptake',
        value: 68,
        description:
          'Share of agents that adopted the shared glossary terms defined by the Accord protocol.'
      },
      {
        id: 'accord-glossary-influence',
        protocol: 'ACCORD',
        name: 'Glossary Influence',
        value: 81,
        description:
          'How much the shared glossary influenced the final outputs of the agents.'
      }
    ]
  };
};

export const useApplicationProtocolImpact = (
  applicationId: string,
  startTime?: number,
  endTime?: number
) => {
  return useQuery<ApplicationProtocolImpact>({
    queryKey: ['applicationProtocolImpact', applicationId, startTime, endTime],
    queryFn: () =>
      fetchApplicationProtocolImpact(applicationId, startTime, endTime)
  });
};
