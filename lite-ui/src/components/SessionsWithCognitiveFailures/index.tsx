/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { MaterialReactTable, MRT_VisibilityState } from 'material-react-table';
import {
  CreateTableInstance,
  EmptyState,
  Stack,
  TableProps,
  TagBackgroundColorVariants,
  Typography,
  useTheme
} from '@open-ui-kit/core';
import { format } from 'date-fns';
import { useSessionsWithCognitiveFailures } from '@/api/scopeApi';
import { GLOBAL_BACKGROUND_COLOR } from '@/common/styles';
import { CognitiveFailureImpactedSession } from '@/types/scope.type';
import { formatDurationMs } from '@/utils/stringUtils';
import { StatusTag } from '../CognitionProtocols/primitives';
import { shortProtocolName } from '../CognitionProtocolsSummary/utils';
import Tags from '../Tags';
import { DateInterval } from '../DateInterval';

type MRT_ColumnDefList = TableProps<CognitiveFailureImpactedSession>['columns'];

// Columns that can be shown from the table toolbar, but are hidden by default.
const DEFAULT_HIDDEN_COLUMNS = ['cost', 'agents', 'llms', 'duration'];

const pluralize = (count: number, singular: string): string =>
  `${count} ${singular}${count === 1 ? '' : 's'}`;

export interface SessionsWithCognitiveFailuresProps {
  applicationId: string;
  onSessionClick?: (session: CognitiveFailureImpactedSession) => void;
  startTime: number;
  endTime: number;
  // Taxonomy code of the cognitive failure, e.g. 'IR-1'
  failureCode: string;
  // Number of sessions impacted by the failure
  sessionCount: number;
  traceCount: number;
  spanCount: number;
}

// The sessions impacted by a cognitive failure pattern, with a summary of
// their traces and spans.
export const SessionsWithCognitiveFailures = ({
  applicationId,
  onSessionClick,
  startTime,
  endTime,
  failureCode,
  sessionCount,
  traceCount,
  spanCount
}: SessionsWithCognitiveFailuresProps) => {
  const theme = useTheme();
  const { data, isLoading } = useSessionsWithCognitiveFailures(
    applicationId,
    startTime,
    endTime,
    failureCode,
    sessionCount
  );
  const sessions = useMemo(() => data ?? [], [data]);
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    Object.fromEntries(DEFAULT_HIDDEN_COLUMNS.map((column) => [column, false]))
  );

  const columns = useMemo<MRT_ColumnDefList>(
    () => [
      {
        accessorKey: 'sessionId',
        header: 'Session ID',
        size: 120
      },
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        size: 120,
        accessorFn: ({ timestamp }) => (
          <Typography variant={'body2'}>
            {timestamp
              ? format(
                  new Date(Number(timestamp) * 1000),
                  'MMM d, yyyy HH:mm:ss'
                )
              : ''}
          </Typography>
        ),
        sortingFn: (rowA, rowB) =>
          Number(rowA.original.timestamp) - Number(rowB.original.timestamp)
      },
      {
        accessorKey: 'cost',
        header: 'Cost',
        accessorFn: ({ cost }) => {
          const numeric = Number(cost);
          return (
            <Typography variant={'body2'}>
              ${Number.isFinite(numeric) ? numeric.toFixed(3) : '0'}
            </Typography>
          );
        },
        sortingFn: (rowA, rowB) => rowA.original.cost - rowB.original.cost
      },
      {
        accessorKey: 'agents',
        header: 'Agents',
        enableSorting: false,
        accessorFn: ({ agents }) => (
          <Tags
            tags={(agents ?? [])
              .filter((agent): agent is string => agent !== null)
              .map((agent) => ({
                name: agent,
                color: TagBackgroundColorVariants.AccentAWeak
              }))}
            minDisplayed={1}
          />
        )
      },
      {
        accessorKey: 'llms',
        header: 'LLMs',
        enableSorting: false,
        accessorFn: ({ llms }) => (
          <Tags
            tags={(llms ?? [])
              .filter((llm): llm is string => llm !== null)
              .map((llm) => ({
                name: llm,
                color: TagBackgroundColorVariants.AccentGWeak
              }))}
            minDisplayed={1}
          />
        )
      },
      {
        accessorKey: 'cognitionProtocols',
        header: 'Cognition Protocols',
        enableSorting: false,
        accessorFn: ({ cognitionProtocols }) => {
          const protocols = (cognitionProtocols ?? []).filter(
            (protocol) => protocol.enabled || protocol.activated
          );
          if (protocols.length === 0) return null;

          return (
            <Stack direction="row" gap="6px">
              {protocols.map((protocol) => (
                <StatusTag
                  key={protocol.protocol}
                  label={`${shortProtocolName(protocol.protocol)}: ${
                    protocol.activated ? 'Activated' : 'Not activated'
                  }`}
                  tone={protocol.activated ? 'positive' : 'info'}
                />
              ))}
            </Stack>
          );
        }
      },
      {
        accessorKey: 'tokens',
        header: 'Tokens',
        size: 120,
        accessorFn: ({ tokens }) => (
          <Typography variant={'body2'}>
            {tokens.toLocaleString('en-US')}
          </Typography>
        ),
        sortingFn: (rowA, rowB) => rowA.original.tokens - rowB.original.tokens
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        accessorFn: ({ duration }) => (
          <Typography variant={'body2'}>
            {formatDurationMs(duration)}
          </Typography>
        ),
        sortingFn: (rowA, rowB) =>
          rowA.original.duration - rowB.original.duration
      }
    ],
    [theme]
  );

  const tableRef = CreateTableInstance({
    data: sessions,
    columns,
    isLoading,
    rowCount: sessions.length,
    title: { label: 'Impacted sessions' },
    titleExtension: <DateInterval startTime={startTime} endTime={endTime} />,
    topToolbarProps: {
      export: { enableExport: false }
    },
    enableSorting: true,
    enableColumnResizing: true,
    renderEmptyRowsFallback: () => (
      <EmptyState
        title={'No impacted sessions'}
        description={'No sessions were impacted by this failure pattern'}
      />
    ),

    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,

    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => onSessionClick?.(row.original),
      sx: { cursor: onSessionClick ? 'pointer' : 'default' }
    }),

    // Shrink the footer "Rows per page" Select, whose width the kit hard-codes
    // (same override as in SessionsTable).
    muiBottomToolbarProps: {
      sx: {
        '& .MuiInputBase-root': {
          width: '80px'
        }
      }
    }
  });

  return <MaterialReactTable table={tableRef} />;
};
