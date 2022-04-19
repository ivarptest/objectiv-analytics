/*
 * Copyright 2022 Objectiv B.V.
 */

import { MockConsoleImplementation, SpyTransport } from '@objectiv/testing-tools';
import { LocationContextName, TrackerConsole } from '@objectiv/tracker-core';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import {
  LocationTree,
  ReactNativeTracker,
  RootLocationContextWrapper,
  TrackedTouchableOpacity,
  TrackedTouchableOpacityProps,
  TrackingContextProvider,
} from '../src';

TrackerConsole.setImplementation(MockConsoleImplementation);

describe('TrackedTouchableOpacity', () => {
  const spyTransport = new SpyTransport();
  jest.spyOn(spyTransport, 'handle');
  const tracker = new ReactNativeTracker({ applicationId: 'app-id', transport: spyTransport });
  jest.spyOn(console, 'error').mockImplementation(jest.fn);

  const TestTrackedTouchableOpacity = (props: TrackedTouchableOpacityProps & { testID?: string }) => (
    <TrackingContextProvider tracker={tracker}>
      <RootLocationContextWrapper id={'test'}>
        <TrackedTouchableOpacity {...props} />
      </RootLocationContextWrapper>
    </TrackingContextProvider>
  );

  beforeEach(() => {
    jest.resetAllMocks();
    LocationTree.clear();
  });

  it('should track PressEvent on press with a PressableContext in the LocationStack', () => {
    const { getByTestId } = render(
      <TestTrackedTouchableOpacity testID="test-touchable-highlight">
        <Text>Trigger Event</Text>
      </TestTrackedTouchableOpacity>
    );

    jest.resetAllMocks();

    fireEvent.press(getByTestId('test-touchable-highlight'));

    expect(spyTransport.handle).toHaveBeenCalledTimes(1);
    expect(spyTransport.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: 'PressEvent',
        location_stack: expect.arrayContaining([
          expect.objectContaining({
            _type: LocationContextName.PressableContext,
            id: 'trigger-event',
          }),
        ]),
      })
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should not track Button if PressableContext id cannot be auto-detected', () => {
    const { getByTestId } = render(
      <TestTrackedTouchableOpacity testID="test-touchable-highlight">
        <Text>☹️</Text>
      </TestTrackedTouchableOpacity>
    );

    jest.resetAllMocks();

    fireEvent.press(getByTestId('test-touchable-highlight'));

    expect(spyTransport.handle).not.toHaveBeenCalled();
  });

  it('should console.error if PressableContext id cannot be auto-detected', () => {
    render(
      <TestTrackedTouchableOpacity testID="test-touchable-highlight">
        <Text>☹️</Text>
      </TestTrackedTouchableOpacity>
    );

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      '｢objectiv｣ Could not generate a valid id for PressableContext @ RootLocation:test. Please provide the `id` property manually.'
    );
  });

  it('should execute onPress handler if specified', () => {
    const onPressSpy = jest.fn();
    const { getByTestId } = render(
      <TestTrackedTouchableOpacity testID="test-touchable-opacity" onPress={onPressSpy}>
        <Text>touchable highlight</Text>
      </TestTrackedTouchableOpacity>
    );

    fireEvent.press(getByTestId('test-touchable-opacity'));

    expect(onPressSpy).toHaveBeenCalledTimes(1);
  });
});
