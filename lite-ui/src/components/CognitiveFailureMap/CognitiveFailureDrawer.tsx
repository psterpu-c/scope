/*
 * Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Card,
  SideDrawer,
  Stack,
  Typography,
  useTheme
} from '@open-ui-kit/core';
import {
  COGNITIVE_FAILURE_FIX_AT,
  CognitiveFailureFixAt
} from '@/common/cognitiveFailureTaxonomy';

const DRAWER_WIDTH = '480px';

export interface CognitiveFailureDrawerProps {
  open: boolean;
  onClose: () => void;
  code: string;
  title: string;
  // Shown above the title, e.g. "Individual · Representational"
  locusLabel: string;
  functionLabel: string;
  // Color of the code, locus and function line
  accentColor: string;
  failureMechanism: string;
  fixAt: CognitiveFailureFixAt[];
}

// The details of a challenge of the Cognitive Failure Map: its failure
// mechanism and when to fix it.
export const CognitiveFailureDrawer = ({
  open,
  onClose,
  code,
  title,
  locusLabel,
  functionLabel,
  accentColor,
  failureMechanism,
  fixAt
}: CognitiveFailureDrawerProps) => {
  const theme = useTheme();
  const borderColor = theme.palette.vars.baseBorderMedium;
  const mutedText = theme.palette.vars.baseTextMedium;

  const sectionCardSx = {
    width: '100%',
    background: 'transparent',
    border: `1px solid ${borderColor}`
  };

  const renderSectionLabel = (label: string) => (
    <Typography
      variant="captionSemibold"
      component="div"
      sx={{ color: mutedText, textTransform: 'uppercase', marginBottom: '8px' }}
    >
      {label}
    </Typography>
  );

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      titleNode={
        <Stack direction="column" gap="4px">
          <Typography
            variant="captionSemibold"
            sx={{ color: accentColor, textTransform: 'uppercase' }}
          >
            {`${code} · ${locusLabel} · ${functionLabel}`}
          </Typography>
          <Typography variant="h5">{title}</Typography>
        </Stack>
      }
      copyURL={''}
      hideTitleAction={true}
      hidePrev={true}
      hideNext={true}
      hideActionButtons={true}
      hideFooter={true}
      paperProps={{
        '&.MuiPaper-root': {
          width: DRAWER_WIDTH,
          minWidth: DRAWER_WIDTH,
          overflowX: 'hidden',
          overflowY: 'auto'
        },
        '&.MuiPaper-root > .MuiBox-root': {
          width: DRAWER_WIDTH
        }
      }}
    >
      <Stack direction="column" gap="16px" sx={{ width: '100%' }}>
        <Card sx={sectionCardSx}>
          {renderSectionLabel('Failure mechanism')}
          <Typography variant="body2">{failureMechanism}</Typography>
        </Card>

        <Card sx={sectionCardSx}>
          {renderSectionLabel('When to fix')}
          <Stack direction="column" gap="12px">
            {fixAt.map((stage) => (
              <Stack key={stage} direction="column" gap="4px">
                <Typography variant="body1Semibold">
                  {COGNITIVE_FAILURE_FIX_AT[stage].label}
                </Typography>
                <Typography variant="body2" sx={{ color: mutedText }}>
                  {COGNITIVE_FAILURE_FIX_AT[stage].description}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Card>
      </Stack>
    </SideDrawer>
  );
};
