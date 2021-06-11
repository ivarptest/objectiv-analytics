import { makeNavigationContext, Tracker } from '@objectiv/tracker-core';
import { ReactNode } from 'react';
import { ReactTracker } from './ReactTracker';
import { TrackerContextProvider, useTracker } from './TrackerContextProvider';

/**
 * Tracker Navigation is a SectionProvider meant to wrap around menus, menu drawers and navigation elements in general.
 *
 * TODO add better docs and some examples
 */
export const TrackerNavigation = ({
  id,
  children,
  tracker = useTracker(),
}: {
  id: string;
  children: ReactNode;
  tracker?: Tracker;
}) => {
  const navigationTracker = new ReactTracker(tracker, { locationStack: [makeNavigationContext({ id })] });

  return <TrackerContextProvider tracker={navigationTracker}>{children}</TrackerContextProvider>;
};
