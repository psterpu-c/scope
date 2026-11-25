/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  GeneralSize,
  SearchInput,
  Stack,
  Tab,
  Tabs,
  Tag,
  TagBackgroundColorVariants,
  Typography,
  green500,
  lavender500,
  orange500,
  pink500,
  teal500,
  useTheme
} from '@open-ui-kit/core';
import {
  COGNITIVE_FAILURE_FUNCTIONS,
  COGNITIVE_FAILURE_LOCI,
  COGNITIVE_FAILURE_MAP,
  CognitiveFailureFunction,
  CognitiveFailureLocus,
  getCognitiveFailureLocus
} from '@/common/cognitiveFailureTaxonomy';

// Accent of each cognitive function: the dot of the filter, the left edge of
// the cards and the tag of the card.
const FUNCTION_STYLES: Record<
  CognitiveFailureFunction,
  { color: string; tag: TagBackgroundColorVariants }
> = {
  Representational: {
    color: teal500,
    tag: TagBackgroundColorVariants.AccentJWeak
  },
  Coordinative: {
    color: lavender500,
    tag: TagBackgroundColorVariants.AccentDWeak
  },
  Epistemic: {
    color: orange500,
    tag: TagBackgroundColorVariants.AccentEWeak
  },
  Systemic: { color: pink500, tag: TagBackgroundColorVariants.AccentCWeak }
};

const LOCUS_COLORS: Record<CognitiveFailureLocus, string> = {
  individual: teal500,
  dyadic: lavender500,
  collective: green500
};

const ALL_LOCI_LABEL = 'All loci';
const ALL_FUNCTIONS_LABEL = 'All functions';

interface Challenge {
  code: string;
  locus: CognitiveFailureLocus;
  title: string;
  description: string;
  function: CognitiveFailureFunction;
  fixAt: string;
}

const CHALLENGES: Challenge[] = Object.entries(COGNITIVE_FAILURE_MAP).map(
  ([code, entry]) => ({
    code,
    locus: getCognitiveFailureLocus(code),
    title: entry.title,
    description: entry.description,
    function: entry.function,
    fixAt: entry.fixAt
  })
);

const Dot = ({ color }: { color: string }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      width: 6,
      height: 6,
      borderRadius: '50%',
      backgroundColor: color
    }}
  />
);

// All the cognitive failure challenges, grouped by locus (one agent, between
// agents, whole team) and filterable by locus, cognitive function and text.
export const CognitiveFailureMap = () => {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  // Index into the loci tabs; 0 is "All loci".
  const [locusIndex, setLocusIndex] = useState(0);
  // Index into the function tabs; 0 is "All functions".
  const [functionIndex, setFunctionIndex] = useState(0);

  const borderColor = theme.palette.vars.baseBorderMedium;
  const mutedText = theme.palette.vars.baseTextMedium;

  const selectedLocus =
    locusIndex === 0 ? undefined : COGNITIVE_FAILURE_LOCI[locusIndex - 1].value;
  const selectedFunction =
    functionIndex === 0
      ? undefined
      : COGNITIVE_FAILURE_FUNCTIONS[functionIndex - 1];

  const visibleChallenges = useMemo(() => {
    const query = search.trim().toLowerCase();
    return CHALLENGES.filter(
      (challenge) =>
        (!selectedLocus || challenge.locus === selectedLocus) &&
        (!selectedFunction || challenge.function === selectedFunction) &&
        (!query ||
          challenge.code.toLowerCase().includes(query) ||
          challenge.title.toLowerCase().includes(query) ||
          challenge.description.toLowerCase().includes(query) ||
          challenge.function.toLowerCase().includes(query))
    );
  }, [search, selectedLocus, selectedFunction]);

  const visibleLoci = COGNITIVE_FAILURE_LOCI.filter(
    (locus) => !selectedLocus || locus.value === selectedLocus
  );

  const renderFilterRow = (
    label: string,
    value: number,
    onChange: (index: number) => void,
    tabs: React.ReactNode[]
  ) => (
    <Stack direction="row" alignItems="center" gap="12px">
      <Typography
        variant="captionSemibold"
        sx={{ color: mutedText, width: '64px', textTransform: 'uppercase' }}
      >
        {label}
      </Typography>
      <Tabs
        type="toggleTab"
        value={value}
        onChange={(_, index: number) => onChange(index)}
      >
        {tabs.map((tab, index) => (
          <Tab key={index} label={tab} />
        ))}
      </Tabs>
    </Stack>
  );

  const renderChallenge = (challenge: Challenge) => {
    const style = FUNCTION_STYLES[challenge.function];
    return (
      <Box
        key={challenge.code}
        sx={{
          padding: '12px 16px',
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          borderLeft: `2px solid ${style.color}`
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          gap="8px"
        >
          <Typography
            variant="captionSemibold"
            sx={{ color: LOCUS_COLORS[challenge.locus] }}
          >
            {challenge.code}
          </Typography>
          <Tag color={style.tag} size={GeneralSize.Small}>
            {challenge.function}
          </Tag>
        </Stack>
        <Typography variant="body2Semibold" component="div" sx={{ mt: '4px' }}>
          {challenge.title}
        </Typography>
        <Typography
          variant="caption"
          component="div"
          sx={{ color: mutedText, mt: '4px' }}
        >
          {challenge.description}
        </Typography>
        <Box sx={{ mt: '8px' }}>
          <Tag size={GeneralSize.Small}>{`Fix at ${challenge.fixAt}`}</Tag>
        </Box>
      </Box>
    );
  };

  const renderLocusColumn = (
    locus: (typeof COGNITIVE_FAILURE_LOCI)[number]
  ) => {
    const challenges = visibleChallenges.filter(
      (challenge) => challenge.locus === locus.value
    );
    return (
      <Card
        key={locus.value}
        sx={{
          minWidth: 0,
          width: '100%',
          background: 'transparent',
          // Tight padding, so the challenge cards use most of the column.
          padding: '12px'
        }}
      >
        <Stack direction="column" gap="8px" sx={{ width: '100%' }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            sx={{
              paddingBottom: '8px',
              borderBottom: `1px solid ${borderColor}`
            }}
          >
            <Stack direction="column">
              <Typography
                variant="captionSemibold"
                sx={{
                  color: LOCUS_COLORS[locus.value],
                  textTransform: 'uppercase'
                }}
              >
                {locus.label}
              </Typography>
              <Typography variant="body2Semibold">{locus.scope}</Typography>
            </Stack>
            <Tag size={GeneralSize.Small}>{challenges.length}</Tag>
          </Stack>
          {challenges.length === 0 ? (
            <Typography variant="caption" sx={{ color: mutedText }}>
              No challenges match.
            </Typography>
          ) : (
            challenges.map(renderChallenge)
          )}
        </Stack>
      </Card>
    );
  };

  return (
    <Stack direction="column" gap="16px" sx={{ width: '100%' }}>
      <Stack direction="row" gap="8px" sx={{ flexWrap: 'wrap' }}>
        <Tag size={GeneralSize.Small}>{`${CHALLENGES.length} challenges`}</Tag>
        <Tag
          size={GeneralSize.Small}
        >{`${COGNITIVE_FAILURE_LOCI.length} loci`}</Tag>
        <Tag
          size={GeneralSize.Small}
        >{`${COGNITIVE_FAILURE_FUNCTIONS.length} cognitive functions`}</Tag>
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap="16px"
      >
        <SearchInput
          placeholder="Search all cognitive challenges"
          value={search}
          onChangeCallback={setSearch}
          sx={{
            width: '320px',
            '& .MuiInputBase-root': { marginTop: 0, width: '100%' }
          }}
        />
        <Typography variant="caption" sx={{ color: mutedText }}>
          {`${visibleChallenges.length} of ${CHALLENGES.length} challenges`}
        </Typography>
      </Stack>

      <Stack direction="column" gap="8px">
        {renderFilterRow('Locus', locusIndex, setLocusIndex, [
          ALL_LOCI_LABEL,
          ...COGNITIVE_FAILURE_LOCI.map((locus) => locus.label)
        ])}
        {renderFilterRow('Function', functionIndex, setFunctionIndex, [
          ALL_FUNCTIONS_LABEL,
          ...COGNITIVE_FAILURE_FUNCTIONS.map((fn) => (
            <Stack key={fn} direction="row" alignItems="center" gap="6px">
              <Dot color={FUNCTION_STYLES[fn].color} />
              {fn}
            </Stack>
          ))
        ])}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          // Always three equal columns, even when a locus filter hides some.
          gridTemplateColumns: `repeat(${COGNITIVE_FAILURE_LOCI.length}, minmax(0, 1fr))`,
          gap: '8px',
          alignItems: 'start'
        }}
      >
        {visibleLoci.map(renderLocusColumn)}
      </Box>
    </Stack>
  );
};
