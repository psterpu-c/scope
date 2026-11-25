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
import { useSessionsIoC } from '@/api/scopeApi';
import { CognitiveFailureImpactedSession } from '@/types/scope.type';
import { formatDurationMs } from '@/utils/stringUtils';
import { StatusTag } from '../CognitionProtocols/primitives';
import { shortProtocolName } from '../CognitionProtocolsSummary/utils';
import Tags from '../Tags';
import { DateInterval } from '../DateInterval';

type MRT_ColumnDefList = TableProps<CognitiveFailureImpactedSession>['columns'];

// Columns that can be shown from the table toolbar, but are hidden by default.
const DEFAULT_HIDDEN_COLUMNS = ['cost', 'agents', 'llms', 'duration'];

export interface SessionsTableIoCProps {
  applicationId: string;
  startTime: number;
  endTime: number;
  title?: string;
  showDateInterval?: boolean;
  onSessionClick?: (session: CognitiveFailureImpactedSession) => void;
}

export const SessionsTableIoC = ({
  applicationId,
  startTime,
  endTime,
  title = 'Sessions',
  showDateInterval = true,
  onSessionClick
}: SessionsTableIoCProps) => {
  const theme = useTheme();
  const { data, isLoading } = useSessionsIoC(applicationId, startTime, endTime);
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
    title: { label: title },
    titleExtension:
      showDateInterval && startTime && endTime ? (
        <DateInterval startTime={startTime} endTime={endTime} />
      ) : undefined,
    topToolbarProps: {
      export: { enableExport: false }
    },
    enableSorting: true,
    enableColumnResizing: true,
    renderEmptyRowsFallback: () => (
      <EmptyState
        title={'No sessions'}
        description={'No sessions found for the selected interval'}
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
