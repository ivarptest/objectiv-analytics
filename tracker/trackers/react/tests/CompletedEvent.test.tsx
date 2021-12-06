/*
 * Copyright 2021 Objectiv B.V.
 */

import { makeCompletedEvent } from '@objectiv/tracker-core';
import { render } from '@testing-library/react';
import { ReactTracker, trackCompletedEvent, useCompletedEventTracker } from '../src';
import { TrackingContextProvider } from '../src/common/TrackingContextProvider';

describe('CompletedEvent', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should track a CompletedEvent (programmatic)', () => {
    const tracker = new ReactTracker({ applicationId: 'app-id' });
    jest.spyOn(tracker, 'trackEvent');

    trackCompletedEvent({ tracker });

    expect(tracker.trackEvent).toHaveBeenCalledTimes(1);
    expect(tracker.trackEvent).toHaveBeenNthCalledWith(1, expect.objectContaining(makeCompletedEvent()));
  });

  it('should track a CompletedEvent (hook relying on ObjectivProvider)', () => {
    const spyTransport = { transportName: 'SpyTransport', handle: jest.fn(), isUsable: () => true };
    const tracker = new ReactTracker({ applicationId: 'app-id', transport: spyTransport });

    const Component = () => {
      const trackCompletedEvent = useCompletedEventTracker();
      trackCompletedEvent();

      return <>Component triggering CompletedEvent</>;
    };

    render(
      <TrackingContextProvider tracker={tracker}>
        <Component />
      </TrackingContextProvider>
    );

    expect(spyTransport.handle).toHaveBeenCalledTimes(1);
    expect(spyTransport.handle).toHaveBeenNthCalledWith(1, expect.objectContaining({ _type: 'CompletedEvent' }));
  });

  it('should track a CompletedEvent (hook with custom tracker)', () => {
    const tracker = new ReactTracker({ applicationId: 'app-id' });
    jest.spyOn(tracker, 'trackEvent');

    const customTracker = new ReactTracker({ applicationId: 'app-id-2' });
    jest.spyOn(customTracker, 'trackEvent');

    const Component = () => {
      const trackCompletedEvent = useCompletedEventTracker(customTracker);
      trackCompletedEvent();

      return <>Component triggering CompletedEvent</>;
    };

    render(
      <TrackingContextProvider tracker={tracker}>
        <Component />
      </TrackingContextProvider>
    );

    expect(tracker.trackEvent).not.toHaveBeenCalled();
    expect(customTracker.trackEvent).toHaveBeenCalledTimes(1);
    expect(customTracker.trackEvent).toHaveBeenNthCalledWith(1, expect.objectContaining(makeCompletedEvent()));
  });
});
