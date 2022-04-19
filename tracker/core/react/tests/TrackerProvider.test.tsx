/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { matchUUID, MockConsoleImplementation } from '@objectiv/testing-tools';
import {
  GlobalContextName,
  GlobalContextValidationRule,
  LocationContextName,
  LocationContextValidationRule,
  Tracker,
  TrackerConsole,
  TrackerPlatform,
} from '@objectiv/tracker-core';
import { render } from '@testing-library/react';
import React from 'react';
import { TrackerProvider, useTracker } from '../src';

TrackerConsole.setImplementation(MockConsoleImplementation);

describe('TrackerProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const tracker = new Tracker({ applicationId: 'app-id' });

  const expectedState = {
    tracker: {
      platform: TrackerPlatform.CORE,
      active: true,
      applicationId: 'app-id',
      global_contexts: [],
      location_stack: [],
      plugins: expect.objectContaining({
        plugins: [
          {
            pluginName: 'OpenTaxonomyValidationPlugin',
            validationRules: [
              new GlobalContextValidationRule({
                logPrefix: 'OpenTaxonomyValidationPlugin',
                contextName: GlobalContextName.ApplicationContext,
                once: true,
              }),
              new LocationContextValidationRule({
                logPrefix: 'OpenTaxonomyValidationPlugin',
                contextName: LocationContextName.RootLocationContext,
                once: true,
                position: 0,
              }),
            ],
          },
          {
            applicationContext: {
              __instance_id: matchUUID,
              __global_context: true,
              _type: GlobalContextName.ApplicationContext,
              id: 'app-id',
            },
            pluginName: 'ApplicationContextPlugin',
          },
        ],
      }),
      queue: undefined,
      trackerId: 'app-id',
      transport: undefined,
    },
  };

  it('should support children components', () => {
    const Component = () => {
      const trackerContext = useTracker();

      console.log({ tracker: trackerContext });

      return null;
    };

    render(
      <TrackerProvider tracker={tracker}>
        <Component />
      </TrackerProvider>
    );

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenNthCalledWith(1, expectedState);
  });

  it('should support render-props', () => {
    render(<TrackerProvider tracker={tracker}>{(trackerContext) => console.log(trackerContext)}</TrackerProvider>);

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenNthCalledWith(1, expectedState);
  });
});
