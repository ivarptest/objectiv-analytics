/*
 * Copyright 2022 Objectiv B.V.
 */

import { MockConsoleImplementation, SpyTransport } from '@objectiv/testing-tools';
import { LocationContextName, TrackerConsole } from '@objectiv/tracker-core';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import {
  LocationTree,
  ReactNativeTracker,
  RootLocationContextWrapper,
  TrackedTextInput,
  TrackedTextInputProps,
  TrackingContextProvider,
} from '../src';

TrackerConsole.setImplementation(MockConsoleImplementation);

describe('TrackedTextInput', () => {
  const spyTransport = new SpyTransport();
  jest.spyOn(spyTransport, 'handle');
  const tracker = new ReactNativeTracker({ applicationId: 'app-id', transport: spyTransport });
  jest.spyOn(console, 'error').mockImplementation(jest.fn);

  const TestTrackedTextInput = (props: TrackedTextInputProps & { testID?: string }) => (
    <TrackingContextProvider tracker={tracker}>
      <RootLocationContextWrapper id={'test'}>
        <TrackedTextInput {...props} />
      </RootLocationContextWrapper>
    </TrackingContextProvider>
  );

  beforeEach(() => {
    jest.resetAllMocks();
    LocationTree.clear();
  });

  it('should track InputChangeEvent on press with a InputContext in the LocationStack', () => {
    const { getByTestId } = render(<TestTrackedTextInput id={'test-switch'} testID="test-switch" />);

    jest.resetAllMocks();

    fireEvent(getByTestId('test-switch'), 'endEditing', true);

    expect(spyTransport.handle).toHaveBeenCalledTimes(1);
    expect(spyTransport.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: 'InputChangeEvent',
        location_stack: expect.arrayContaining([
          expect.objectContaining({
            _type: LocationContextName.InputContext,
            id: 'test-switch',
          }),
        ]),
      })
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should execute onValueChange handler if specified', () => {
    const onEndEditingSpy = jest.fn();
    const { getByTestId } = render(
      <TestTrackedTextInput id={'test-switch'} testID="test-switch" onEndEditing={onEndEditingSpy} />
    );

    fireEvent(getByTestId('test-switch'), 'endEditing', true);

    expect(onEndEditingSpy).toHaveBeenCalledTimes(1);
  });
});
