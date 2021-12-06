/*
 * Copyright 2021 Objectiv B.V.
 */

import { makeSectionVisibleEvent } from '@objectiv/tracker-core';
import { render } from '@testing-library/react';
import { ReactTracker, trackSectionVisibleEvent, useSectionVisibleEventTracker } from '../src';
import { TrackingContextProvider } from '../src/common/TrackingContextProvider';

describe('SectionVisibleEvent', () => {
  it('should track a SectionVisibleEvent', () => {
    const tracker = new ReactTracker({ applicationId: 'app-id' });
    jest.spyOn(tracker, 'trackEvent');

    trackSectionVisibleEvent({ tracker });

    expect(tracker.trackEvent).toHaveBeenCalledTimes(1);
    expect(tracker.trackEvent).toHaveBeenNthCalledWith(1, expect.objectContaining(makeSectionVisibleEvent()));
  });

  it('should track a SectionVisibleEvent (hook relying on ObjectivProvider)', () => {
    const spyTransport = { transportName: 'SpyTransport', handle: jest.fn(), isUsable: () => true };
    const tracker = new ReactTracker({ applicationId: 'app-id', transport: spyTransport });

    const Component = () => {
      const trackSectionVisibleEvent = useSectionVisibleEventTracker();
      trackSectionVisibleEvent();

      return <>Component triggering SectionVisibleEvent</>;
    };

    render(
      <TrackingContextProvider tracker={tracker}>
        <Component />
      </TrackingContextProvider>
    );

    expect(spyTransport.handle).toHaveBeenCalledTimes(1);
    expect(spyTransport.handle).toHaveBeenNthCalledWith(1, expect.objectContaining({ _type: 'SectionVisibleEvent' }));
  });

  it('should track a SectionVisibleEvent (hook with custom tracker)', () => {
    const tracker = new ReactTracker({ applicationId: 'app-id' });
    jest.spyOn(tracker, 'trackEvent');

    const customTracker = new ReactTracker({ applicationId: 'app-id-2' });
    jest.spyOn(customTracker, 'trackEvent');

    const Component = () => {
      const trackSectionVisibleEvent = useSectionVisibleEventTracker(customTracker);
      trackSectionVisibleEvent();

      return <>Component triggering SectionVisibleEvent</>;
    };

    render(
      <TrackingContextProvider tracker={tracker}>
        <Component />
      </TrackingContextProvider>
    );

    expect(tracker.trackEvent).not.toHaveBeenCalled();
    expect(customTracker.trackEvent).toHaveBeenCalledTimes(1);
    expect(customTracker.trackEvent).toHaveBeenNthCalledWith(1, expect.objectContaining(makeSectionVisibleEvent()));
  });
});
