/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { MaterialReactTable, MRT_VisibilityState } from 'material-react-table';
import {
  CreateTableInstance,
  EmptyState,
  TableProps,
  TagBackgroundColorVariants,
  Typography,
  useTheme
} from '@open-ui-kit/core';
import { format } from 'date-fns';
import { metricCatalog } from '@/common';
import { CognitiveFailureImpactedSession } from '@/types/scope.type';
import { formatMetricValue } from '@/utils/metrics';
import { formatDurationMs } from '@/utils/stringUtils';
import Tags from '../Tags';
import { DateInterval } from '../DateInterval';

// A session with its metric values, by metric name. A metric is undefined when
// the session has no value for it.
export type SessionWithMetrics = CognitiveFailureImpactedSession & {
  metrics: Record<string, number | undefined>;
};

type MRT_ColumnDefList = TableProps<SessionWithMetrics>['columns'];

// Columns that can be shown from the table toolbar, but are hidden by default.
const DEFAULT_HIDDEN_COLUMNS = ['cost', 'agents', 'llms', 'tokens', 'duration'];

export interface SessionsTableIoCProps {
  sessions: SessionWithMetrics[];
  isLoading?: boolean;
  startTime: number;
  endTime: number;
  title?: string;
  showDateInterval?: boolean;
  // Names of the session metrics to show as columns (keys of the metric
  // catalog, e.g. 'Groundedness').
  metricKeys?: string[];
  onSessionClick?: (session: CognitiveFailureImpactedSession) => void;
}

const NO_METRIC_KEYS: string[] = [];

export const SessionsTableIoC = ({
  sessions,
  isLoading = false,
  startTime,
  endTime,
  title = 'Sessions',
  showDateInterval = true,
  metricKeys = NO_METRIC_KEYS,
  onSessionClick
}: SessionsTableIoCProps) => {
  const theme = useTheme();
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
      ...metricKeys.flatMap((metricKey) => {
        const catalogEntry =
          metricCatalog[metricKey as keyof typeof metricCatalog];
        if (!catalogEntry) return [];
        return [
          {
            id: metricKey,
            header: catalogEntry.name,
            accessorFn: ({ metrics }: SessionWithMetrics) => {
              const value = metrics[metricKey];
              return (
                <Typography variant={'body2'}>
                  {value === undefined
                    ? '—'
                    : formatMetricValue(Number(value), catalogEntry.unit)}
                </Typography>
              );
            },
            sortingFn: (
              rowA: { original: SessionWithMetrics },
              rowB: { original: SessionWithMetrics }
            ) =>
              (rowA.original.metrics[metricKey] ?? -Infinity) -
              (rowB.original.metrics[metricKey] ?? -Infinity)
          }
        ];
      }),
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
    [theme, metricKeys]
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
