/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseTimestamp } from '@/utils/dateUtils';
import {
  MenuItem,
  Select,
  Grid,
  Stack,
  Typography,
  FormControl,
  useTheme
} from '@mui/material';
import { ApplicationCard } from '@/components';
import { ApplicationIoC } from '@/types/scopeApi.type';
import { useApplicationsIoC } from '@/api/scopeApi';
import {
  RepositorySortOption,
  RepositorySortOptionLabel
} from '@/common/constants';
import { SearchInput, Spinner } from '@open-ui-kit/core';
import { useMemo, useState } from 'react';

const size = { xxl: 2, xl: 3, lg: 4, md: 3 };

export const ApplicationsGridIoC = () => {
  const theme = useTheme();
  const [sortBy, setSortBy] = useState<RepositorySortOption>(
    RepositorySortOption.mostRecent
  );
  const [queryFilter, setQueryFilter] = useState('');
  const { data, error, isLoading } = useApplicationsIoC();

  const applications = useMemo<ApplicationIoC[]>(
    () =>
      (data?.applications ?? [])
        .filter((application) =>
          application.applicationName
            .toLowerCase()
            .includes(queryFilter.toLowerCase())
        )
        .sort((a, b) => {
          if (sortBy === RepositorySortOption.mostRecent) {
            return (
              (parseTimestamp(b.timestamp)?.getTime() ?? 0) -
              (parseTimestamp(a.timestamp)?.getTime() ?? 0)
            );
          }
          return (
            new Date(a.timestamp ?? 0).getTime() -
            new Date(b.timestamp ?? 0).getTime()
          );
        }),
    [data?.applications, queryFilter, sortBy]
  );

  if (isLoading) {
    return (
      <Stack
        alignItems={'center'}
        justifyContent={'center'}
        sx={{ width: '100%', height: '100%' }}
      >
        <Spinner />
      </Stack>
    );
  }

  if (error) {
    return <>An error occurred!</>;
  }

  return (
    <Stack direction={'column'} gap={'16px'} sx={{ paddingTop: '24px' }}>
      <SearchInput
        placeholder="Search by application name"
        value={queryFilter}
        onChangeCallback={setQueryFilter}
        sx={{
          '& .MuiInputBase-root': {
            marginTop: 0,
            width: '100%',
            height: '36px'
          }
        }}
      />

      <Stack direction={'row'} justifyContent={'space-between'}>
        <Typography variant={'h6'}>{applications.length} results</Typography>
        <FormControl sx={{ width: '221px' }}>
          <Select
            value={sortBy}
            renderValue={() => RepositorySortOptionLabel[sortBy]}
            onChange={(e) => setSortBy(e.target.value)}
            label="Sort by"
            variant="standard"
            sx={{
              height: '36px',
              marginTop: 0,
              '&.MuiInputBase-root': {
                backgroundColor: theme.palette.vars.controlBackgroundDefault
              },
              '& .MuiSelect-select': {
                backgroundColor: theme.palette.vars.controlBackgroundDefault,
                color: theme.palette.vars.baseTextDefault
              }
            }}
          >
            <MenuItem value={RepositorySortOption.mostRecent}>
              {RepositorySortOptionLabel[RepositorySortOption.mostRecent]}
            </MenuItem>
            <MenuItem value={RepositorySortOption.oldest}>
              {RepositorySortOptionLabel[RepositorySortOption.oldest]}
            </MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Grid container spacing={'16px'}>
        {applications.map((application) => (
          <Grid size={size} key={application.applicationName}>
            <ApplicationCard application={application} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default ApplicationsGridIoC;
