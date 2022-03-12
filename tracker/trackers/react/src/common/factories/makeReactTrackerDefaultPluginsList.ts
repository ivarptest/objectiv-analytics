/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { HttpContextPlugin } from '@objectiv/plugin-http-context';
import { PathContextFromURLPlugin } from '@objectiv/plugin-path-context-from-url';
import { RootLocationContextFromURLPlugin } from '@objectiv/plugin-root-location-context-from-url';
import { makeCoreTrackerDefaultPluginsList, TrackerPluginInterface } from '@objectiv/tracker-core';
import { ReactTrackerConfig } from '../../ReactTracker';

/**
 * The default list of Plugins of React Tracker
 */
export const makeReactTrackerDefaultPluginsList = (trackerConfig: ReactTrackerConfig) => {
  const {
    trackHttpContext = true,
    trackPathContextFromURL = true,
    trackRootLocationContextFromURL = true,
  } = trackerConfig;

  const plugins: TrackerPluginInterface[] = makeCoreTrackerDefaultPluginsList();

  if (trackHttpContext) {
    plugins.push(new HttpContextPlugin());
  }

  if (trackPathContextFromURL) {
    plugins.push(new PathContextFromURLPlugin());
  }

  if (trackRootLocationContextFromURL) {
    plugins.push(new RootLocationContextFromURLPlugin());
  }

  return plugins;
};
