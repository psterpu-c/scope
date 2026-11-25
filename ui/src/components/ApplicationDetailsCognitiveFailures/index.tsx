/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  Divider,
  GeneralSize,
  SearchInput,
  Stack,
  Tab,
  Tabs,
  Tag,
  TagBackgroundColorVariants,
  Typography,
  useTheme
} from '@open-ui-kit/core';
import { CONFIDENCE_LABELS } from '@/common/cognitiveFailureConfidence';
import { getCognitiveFailureTaxonomy } from '@/common/cognitiveFailureTaxonomy';
import {
  CognitiveFailureImpactedSession,
  CognitiveFailurePattern,
  CognitiveFailurePatternLevel
} from '@/types/scope.type';
import { SessionsWithCognitiveFailures } from '../SessionsWithCognitiveFailures';

type LevelFilter = 'all' | CognitiveFailurePatternLevel;

const FILTERS: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'individual', label: 'Individual' },
  { value: 'dyadic', label: 'Dyadic' },
  { value: 'collective', label: 'Collective' }
];

const LEVELS: {
  value: CognitiveFailurePatternLevel;
  // Heading of the group in the list
  groupLabel: string;
  // Label shown in the tag of the selected pattern
  tagLabel: string;
}[] = [
  {
    value: 'individual',
    groupLabel: 'Individual · One agent',
    tagLabel: 'Individual · one agent'
  },
  {
    value: 'dyadic',
    groupLabel: 'Dyadic · Between agents',
    tagLabel: 'Dyadic · between agents'
  },
  {
    value: 'collective',
    groupLabel: 'Collective · Whole team',
    tagLabel: 'Collective · whole team'
  }
];

const getPatternTitle = (code: string): string =>
  getCognitiveFailureTaxonomy(code)?.title ?? code;

const pluralize = (count: number, singular: string): string =>
  `${count} ${singular}${count === 1 ? '' : 's'}`;

export interface ApplicationDetailsCognitiveFailuresProps {
  applicationId: string;
  onSessionClick?: (session: CognitiveFailureImpactedSession) => void;
  startTime: number;
  endTime: number;
  failurePatterns: CognitiveFailurePattern[];
}

// Main/detail view of the detected cognitive failure patterns: the list of
// patterns on the left and the details of the selected one on the right.
export const ApplicationDetailsCognitiveFailures = ({
  applicationId,
  onSessionClick,
  startTime,
  endTime,
  failurePatterns
}: ApplicationDetailsCognitiveFailuresProps) => {
  const theme = useTheme();
  const [filter, setFilter] = useState<LevelFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState<string>();

  const visiblePatterns = useMemo(() => {
    const query = search.trim().toLowerCase();
    return failurePatterns.filter(
      (pattern) =>
        (filter === 'all' || pattern.level === filter) &&
        (!query ||
          getPatternTitle(pattern.code).toLowerCase().includes(query) ||
          pattern.code.toLowerCase().includes(query) ||
          pattern.category.toLowerCase().includes(query))
    );
  }, [failurePatterns, filter, search]);

  // Falls back to the first visible pattern when nothing is selected or the
  // selection is filtered out.
  const selectedPattern =
    visiblePatterns.find((pattern) => pattern.code === selectedCode) ??
    visiblePatterns[0];

  const borderColor = theme.palette.vars.baseBorderMedium;
  const mutedText = theme.palette.vars.baseTextMedium;
  const weakText = theme.palette.vars.baseTextWeak;
  const accentText = theme.palette.vars.brandTextPrimary;

  const renderPatternItem = (pattern: CognitiveFailurePattern) => {
    const selected = pattern.code === selectedPattern?.code;
    return (
      <Box
        key={pattern.code}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedCode(pattern.code)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setSelectedCode(pattern.code);
          }
        }}
        sx={{
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '8px',
          border: `1px solid ${
            selected
              ? theme.palette.vars.interactivePrimaryDefaultDefault
              : borderColor
          }`,
          backgroundColor: selected
            ? theme.palette.vars.baseBackgroundMedium
            : 'transparent',
          '&:hover': {
            backgroundColor: theme.palette.vars.baseBackgroundMedium
          }
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          gap="8px"
        >
          <Typography variant="body2Semibold">
            {getPatternTitle(pattern.code)}
          </Typography>
          <Typography
            variant="captionSemibold"
            sx={{ color: accentText, flexShrink: 0 }}
          >
            {pattern.code}
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: mutedText }}>
          {pattern.category}
        </Typography>
        <Typography
          variant="caption"
          component="div"
          sx={{ color: weakText, marginTop: '4px' }}
        >
          {pluralize(pattern.impactedSessionCount, 'impacted session')}
        </Typography>
      </Box>
    );
  };

  const renderPatternList = () => {
    if (visiblePatterns.length === 0) {
      return (
        <Typography variant="body2" sx={{ color: mutedText }}>
          No failure patterns match.
        </Typography>
      );
    }

    return (
      <Stack direction="column" gap="16px">
        {LEVELS.map((level) => {
          const patterns = visiblePatterns.filter(
            (pattern) => pattern.level === level.value
          );
          if (patterns.length === 0) return null;
          return (
            <Stack key={level.value} direction="column" gap="8px">
              <Typography variant="captionSemibold" sx={{ color: mutedText }}>
                {level.groupLabel}
              </Typography>
              {patterns.map(renderPatternItem)}
            </Stack>
          );
        })}
      </Stack>
    );
  };

  const renderPatternDetails = (pattern: CognitiveFailurePattern) => {
    const taxonomy = getCognitiveFailureTaxonomy(pattern.code);
    const level = LEVELS.find((item) => item.value === pattern.level);
    const stats = [
      {
        label: 'Impacted sessions',
        value: pattern.impactedSessionCount
      },
      { label: 'Agents involved', value: pattern.agentsInvolved },
      { label: 'Total alerts', value: pattern.totalAlerts },
      {
        label: 'Detection confidence',
        value: CONFIDENCE_LABELS[pattern.confidence] ?? pattern.confidence
      }
    ];

    return (
      <Stack direction="column" gap="16px" sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="column" gap="8px">
          <Typography variant="h5">{getPatternTitle(pattern.code)}</Typography>
          {taxonomy && (
            <Typography variant="body2" sx={{ color: mutedText }}>
              {taxonomy.summary}
            </Typography>
          )}
          <Stack direction="row" gap="8px" sx={{ flexWrap: 'wrap' }}>
            <Tag
              color={TagBackgroundColorVariants.AccentAWeak}
              size={GeneralSize.Small}
            >
              {pattern.code}
            </Tag>
            {level && <Tag size={GeneralSize.Small}>{level.tagLabel}</Tag>}
            <Tag size={GeneralSize.Small}>{pattern.category}</Tag>
            <Tag size={GeneralSize.Small}>Detected</Tag>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          sx={{
            border: `1px solid ${borderColor}`,
            borderRadius: '8px'
          }}
        >
          {stats.map((stat, index) => (
            <Box
              key={stat.label}
              sx={{
                flex: '1 1 0',
                padding: '12px 16px',
                borderLeft: index === 0 ? 'none' : `1px solid ${borderColor}`
              }}
            >
              <Typography variant="h5">{stat.value}</Typography>
              <Typography variant="captionSemibold" sx={{ color: mutedText }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Card
          sx={{
            width: '100%',
            background: 'transparent',
            border: `1px solid ${borderColor}`
          }}
        >
          <Typography variant="body2Semibold" component="div">
            Why this happened
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: mutedText, marginTop: '8px' }}
          >
            {pattern.whyItHappened}
          </Typography>
        </Card>

        <SessionsWithCognitiveFailures
          applicationId={applicationId}
          onSessionClick={onSessionClick}
          startTime={startTime}
          endTime={endTime}
          failureCode={pattern.code}
          sessionCount={pattern.impactedSessionCount}
          traceCount={pattern.traceCount}
          spanCount={pattern.spanCount}
        />

        <Card
          sx={{
            width: '100%',
            background: 'transparent',
            border: `1px solid ${theme.palette.vars.interactivePrimaryDefaultDefault}`
          }}
        >
          <Typography
            variant="captionSemibold"
            component="div"
            sx={{ color: accentText, textTransform: 'uppercase' }}
          >
            How L9 addresses it
          </Typography>
          <Typography
            variant="h6"
            sx={{ marginTop: '8px' }}
          >{`${pattern.protocolResponse.protocol} · ${pattern.protocolResponse.title}`}</Typography>
          <Typography
            variant="body2"
            sx={{ color: mutedText, marginTop: '8px' }}
          >
            {pattern.protocolResponse.description}
          </Typography>
        </Card>
      </Stack>
    );
  };

  return (
    <Stack
      direction="row"
      gap="16px"
      alignItems="flex-start"
      sx={{ width: '100%' }}
    >
      <Stack
        direction="column"
        gap="12px"
        sx={{
          width: '320px',
          flexShrink: 0,
          padding: '12px',
          border: `1px solid ${borderColor}`,
          borderRadius: '8px'
        }}
      >
        <Stack direction="column">
          <Typography variant="body2Semibold">Failure patterns</Typography>
          <Typography variant="captionSemibold" sx={{ color: mutedText }}>
            {`${failurePatterns.length} detected`}
          </Typography>
        </Stack>
        <SearchInput
          placeholder="Search failure patterns"
          value={search}
          onChangeCallback={setSearch}
          sx={{
            width: '100%',
            minWidth: 0,
            '& .MuiInputBase-root': { marginTop: 0, width: '100%' }
          }}
        />
        <Tabs
          type="toggleTab"
          value={FILTERS.findIndex((item) => item.value === filter)}
          onChange={(_, index: number) => setFilter(FILTERS[index].value)}
          // The kit sizes toggle tabs to fit their content, with 24px of
          // horizontal padding each, which doesn't fit the narrow list pane.
          boxProps={{ sx: { width: '100%', maxWidth: '100%' } }}
          sx={{ width: '100%' }}
        >
          {FILTERS.map((item) => (
            <Tab
              key={item.value}
              label={item.label}
              sx={{ flex: '1 1 auto', padding: '8px 4px' }}
            />
          ))}
        </Tabs>
        <Divider />
        {renderPatternList()}
      </Stack>

      {selectedPattern ? (
        renderPatternDetails(selectedPattern)
      ) : (
        <Typography variant="body2" sx={{ color: mutedText }}>
          Select a failure pattern to see its details.
        </Typography>
      )}
    </Stack>
  );
};
