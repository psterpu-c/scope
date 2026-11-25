/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  SvgIcon,
  useTheme
} from '@mui/material';
import { SideBarItemList } from './SideBarItemList';
import {
  sideBarDrawerStyle,
  sideBarPaperStyle,
  sideBarToggleButtonStyle
} from './styles';
export const Sidebar = () => {
  const theme = useTheme();

  // Collapsed (icons only) by default, on every page
  const [collapsed, setCollapsed] = useState(true);

  const isCompact = collapsed;

  return (
    <Box sx={sideBarDrawerStyle(theme, isCompact)}>
      <Drawer
        variant="permanent"
        anchor="left"
        slotProps={{
          paper: {
            sx: sideBarPaperStyle(theme, isCompact)
          }
        }}
        sx={sideBarDrawerStyle(theme, isCompact)}
        data-testid="sidebar"
      >
        <Stack
          direction="column"
          justifyContent="space-between"
          sx={{ height: '100%', paddingLeft: '8px', paddingRight: '8px' }}
        >
          <SideBarItemList compact={collapsed} />

          <Box sx={{ paddingBottom: '16px' }}>
            <IconButton
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={
                collapsed
                  ? 'Expand side navigation'
                  : 'Collapse side navigation'
              }
              aria-expanded={!collapsed}
              title={collapsed ? 'Expand' : 'Collapse'}
              data-testid="sidebar-toggle"
              sx={sideBarToggleButtonStyle(theme)}
            >
              <SvgIcon fontSize="small">
                {collapsed ? (
                  // chevron right
                  <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                ) : (
                  // chevron left
                  <path d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
                )}
              </SvgIcon>
            </IconButton>
          </Box>
        </Stack>
      </Drawer>
    </Box>
  );
};
