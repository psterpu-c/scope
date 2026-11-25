/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

// Taxonomy of the cognitive failures, keyed by code. The API returns the code
// as the failure `name` (e.g. 'DC-4'); the title and the summary are shown in
// its place.
//
// Source of the codes and summaries: backend/workers/cognitive-failure-worker/src/cognitive_failure_worker/data/failures.json
// (`code` and `summary`). Keep in sync when the taxonomy changes there.
// The `title` is the display title, as shown on the Cognitive Failure Map, and
// can differ from the `name` in failures.json.
// The summary is the general description of the failure, not the detector's
// reasoning for a given session (that is `CognitiveFailure.description`).

// Where the failure happens: in one agent, between two agents, or in the team.
export type CognitiveFailureLocus = 'individual' | 'dyadic' | 'collective';

export type CognitiveFailureFunction =
  | 'Representational'
  | 'Coordinative'
  | 'Epistemic'
  | 'Systemic';

// When the failure is best fixed.
export type CognitiveFailureFixAt =
  | 'runtime'
  | 'bootstrap'
  | 'design'
  | 'verify';

export interface CognitiveFailureTaxonomyEntry {
  title: string;
  summary: string;
  // The fields below are those of the Cognitive Failure Map. A failure
  // without them is not shown on the map.
  // One-line description shown on the map card.
  shortDescription?: string;
  function?: CognitiveFailureFunction;
  fixAt?: CognitiveFailureFixAt;
}

export const COGNITIVE_FAILURE_TAXONOMY: Record<
  string,
  CognitiveFailureTaxonomyEntry
> = {
  // Individual
  'IR-1': {
    title: 'Instruction Retention Failure',
    summary: 'Agent loses earlier instructions as its context window fills.',
    shortDescription: 'Earlier instructions fall out of context.',
    function: 'Representational',
    fixAt: 'runtime'
  },
  'IC-1': {
    title: 'Intention Stability Failure',
    summary: 'Agent has the right commitment but drops it under interference.',
    shortDescription: 'An agent abandons a correct commitment too early.',
    function: 'Coordinative',
    fixAt: 'runtime'
  },
  'IC-2': {
    title: 'Plan Revision Failure',
    summary:
      'Agent has the right plan but fails to revise it when context changes.',
    shortDescription: 'The plan does not adapt when the evidence changes.',
    function: 'Coordinative',
    fixAt: 'runtime'
  },
  'IE-1': {
    title: 'Individual Metacognitive Blindness',
    summary:
      'Agent does not know what it does not know, and proceeds with false confidence.',
    shortDescription: 'An agent is confident about unsupported claims.',
    function: 'Epistemic',
    fixAt: 'runtime'
  },

  // Dyadic
  'DR-1': {
    title: 'Semantic & Ontological Misalignment',
    summary: 'Agents use the same word to mean different things.',
    shortDescription: 'The same term means different things to two agents.',
    function: 'Representational',
    fixAt: 'bootstrap'
  },
  'DR-2': {
    title: 'Representational Fidelity Loss',
    summary:
      'Information is physically lost or truncated in transit — the receiver never gets what the sender produced.',
    shortDescription: 'Information changes while crossing an interface.',
    function: 'Representational',
    fixAt: 'runtime'
  },
  'DC-1': {
    title: 'Communication Policy Inefficiency',
    summary:
      'Agents communicate too much, too little, or with the wrong signal density.',
    shortDescription: 'Agents share too much or too little information.',
    function: 'Coordinative',
    fixAt: 'design'
  },
  'DC-2': {
    title: 'Message Force Misidentification',
    summary:
      'Agent mistakes what kind of speech act it received — a directive treated as a suggestion.',
    shortDescription: 'A required directive is treated as optional advice.',
    function: 'Coordinative',
    fixAt: 'runtime'
  },
  'DC-3': {
    title: 'Negotiation & Consensus Failure',
    summary:
      'Agents exchange positions but never issue binding proposals that create obligations.',
    shortDescription: 'Agents exchange positions without converging.',
    function: 'Coordinative',
    fixAt: 'verify'
  },
  'DC-4': {
    title: 'Task Delegation Authority Failure',
    summary:
      'Agent delegates a task to the wrong peer because its model of peer capabilities is inaccurate.',
    shortDescription: 'An agent acts without clear execution authority.',
    function: 'Coordinative',
    fixAt: 'runtime'
  },
  'DE-1': {
    title: 'Peer Knowledge Modeling Failure',
    summary:
      "Agent routes a query to a peer that doesn't hold the knowledge, or misjudges which of several peer replies to trust.",
    shortDescription: 'A task is sent to a peer without the right expertise.',
    function: 'Epistemic',
    fixAt: 'design'
  },

  // Collective
  'CR-1': {
    title: 'Shared Task Model Failure',
    summary:
      'Agents start with incompatible understandings of what the task requires.',
    shortDescription:
      'The team starts with different understandings of the task.',
    function: 'Representational',
    fixAt: 'design'
  },
  'CR-2': {
    title: 'Shared State Degradation',
    summary:
      'Shared memory becomes inconsistent because agents write to it concurrently without coordination.',
    shortDescription: 'Concurrent writes corrupt shared context.',
    function: 'Representational',
    fixAt: 'runtime'
  },
  'CC-1': {
    title: 'Task Decomposition & Allocation',
    summary:
      "The system's task or role allocation has structural gaps or conflicts — whether roles were defined wrongly or never defined at all.",
    shortDescription: 'Work is left unassigned or assigned twice.',
    function: 'Coordinative',
    fixAt: 'design'
  },
  'CC-2': {
    title: 'Collective Goal Coordination',
    summary:
      'No mechanism exists — at design time or runtime — for agents to jointly hold and coordinate their pursuit of the collective goal.',
    shortDescription: 'The team cannot maintain a common global goal.',
    function: 'Coordinative',
    fixAt: 'design'
  },
  'CC-3': {
    title: 'Incomplete Synthesis',
    summary:
      'Orchestrator commits a final output without reconciling conflicting sub-agent results.',
    shortDescription:
      'Conflicting specialist outputs are combined without resolution.',
    function: 'Coordinative',
    fixAt: 'verify'
  },
  'CC-4': {
    title: 'Situational State Synchronization',
    summary:
      'No mechanism broadcasts situational updates to all agents, so models of current state silently diverge during execution.',
    shortDescription: 'New discoveries do not reach the rest of the team.',
    function: 'Coordinative',
    fixAt: 'verify'
  },
  'CE-1': {
    title: 'Verification & Epistemic Control',
    summary:
      'The system commits a confident output without a collective checking step — with or without contradictions present.',
    shortDescription:
      'The system accepts an answer without genuine validation.',
    function: 'Epistemic',
    fixAt: 'verify'
  },
  'CS-1': {
    title: 'Collective Reasoning Degradation',
    summary:
      'Agents herd toward an early confident output, suppressing independent reasoning.',
    shortDescription:
      'The team suppresses dissent and converges on a wrong answer.',
    function: 'Systemic',
    fixAt: 'runtime'
  },
  // Not on the Cognitive Failure Map.
  'CS-2': {
    title: 'Unformalized Coordination Commitments',
    summary:
      'Coordination works until the first perturbation, because it rested on unspoken convention.'
  }
};

// The taxonomy entry of a failure code, or undefined for an unknown code.
export const getCognitiveFailureTaxonomy = (
  code: string
): CognitiveFailureTaxonomyEntry | undefined =>
  Object.prototype.hasOwnProperty.call(COGNITIVE_FAILURE_TAXONOMY, code)
    ? COGNITIVE_FAILURE_TAXONOMY[code]
    : undefined;

// "Task Delegation Authority Failure (DC-4)"; an unknown code is shown as it is.
export const getCognitiveFailureLabel = (code: string): string => {
  const entry = getCognitiveFailureTaxonomy(code);
  return entry ? `${entry.title} (${code})` : code;
};

// ---------------------------------------------------------------------------
// Cognitive failure map
// ---------------------------------------------------------------------------

export interface CognitiveFailureMapEntry {
  title: string;
  description: string;
  function: CognitiveFailureFunction;
  fixAt: CognitiveFailureFixAt;
}

export const COGNITIVE_FAILURE_LOCI: {
  value: CognitiveFailureLocus;
  label: string;
  // Sub-heading of the locus, e.g. "One agent"
  scope: string;
}[] = [
  { value: 'individual', label: 'Individual', scope: 'One agent' },
  { value: 'dyadic', label: 'Dyadic', scope: 'Between agents' },
  { value: 'collective', label: 'Collective', scope: 'Whole team' }
];

export const COGNITIVE_FAILURE_FUNCTIONS: CognitiveFailureFunction[] = [
  'Representational',
  'Coordinative',
  'Epistemic',
  'Systemic'
];

// The challenges shown on the Cognitive Failure Map page, keyed by code: the
// taxonomy entries that have the map fields.
export const COGNITIVE_FAILURE_MAP: Record<string, CognitiveFailureMapEntry> =
  Object.fromEntries(
    Object.entries(COGNITIVE_FAILURE_TAXONOMY).flatMap(([code, entry]) =>
      entry.shortDescription && entry.function && entry.fixAt
        ? [
            [
              code,
              {
                title: entry.title,
                description: entry.shortDescription,
                function: entry.function,
                fixAt: entry.fixAt
              }
            ]
          ]
        : []
    )
  );

// The locus of a failure code, from its first letter: I(ndividual),
// D(yadic) or C(ollective).
export const getCognitiveFailureLocus = (
  code: string
): CognitiveFailureLocus =>
  code.startsWith('I')
    ? 'individual'
    : code.startsWith('D')
      ? 'dyadic'
      : 'collective';
