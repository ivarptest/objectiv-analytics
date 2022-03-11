/*
 * Copyright 2022 Objectiv B.V.
 */

import { mockConsole } from '@objectiv/testing-tools';
import {
  ContentContextWrapper,
  makeReactNativeTrackerDefaultPluginsList,
  ObjectivProvider,
  ReactNativeTracker,
  RootLocationContextWrapper,
} from '@objectiv/tracker-react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { ContextsFromReactNavigationPlugin, TrackedLink, TrackedLinkProps } from '../src';

type TestParamList = {
  HomeScreen: undefined;
  DestinationScreen: { parameter: number };
};

describe('TrackedLink', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const spyTransport = { transportName: 'SpyTransport', handle: jest.fn(), isUsable: () => true };

  const cases: [
    TrackedLinkProps<TestParamList>,
    { id: string; href: string }, // LinkContext
    { id: string }, // RootLocationContext
    { id: string } // PathContext
  ][] = [
    [
      { to: '/DestinationScreen', children: 'test' },
      { id: 'test', href: '/DestinationScreen' },
      { id: 'HomeScreen' },
      { id: '/HomeScreen' },
    ],
    [
      { to: '/DestinationScreen', children: 'test', id: 'custom-id' },
      { id: 'custom-id', href: '/DestinationScreen' },
      { id: 'HomeScreen' },
      { id: '/HomeScreen' },
    ],
    [
      { to: '/DestinationScreen', children: '', id: 'custom-id' },
      { id: 'custom-id', href: '/DestinationScreen' },
      { id: 'HomeScreen' },
      { id: '/HomeScreen' },
    ],
    [
      { to: { screen: 'DestinationScreen' }, children: 'test' },
      { id: 'test', href: '/DestinationScreen' },
      { id: 'HomeScreen' },
      { id: '/HomeScreen' },
    ],
    [
      { to: { screen: 'DestinationScreen', params: { parameter: 123 } }, children: 'test' },
      { id: 'test', href: '/DestinationScreen?parameter=123' },
      { id: 'HomeScreen' },
      { id: '/HomeScreen' },
    ],
  ];

  cases.forEach(([linkProps, linkContext, rootLocationContext, pathContext]) => {
    it(`props: ${JSON.stringify(linkProps)} > LinkContext: ${JSON.stringify(linkContext)}`, () => {
      const navigationContainerRef = createNavigationContainerRef();
      const trackerConfig = {
        applicationId: 'app-id',
        transport: spyTransport,
        console: mockConsole,
      };
      const tracker = new ReactNativeTracker({
        applicationId: 'app-id',
        transport: spyTransport,
        console: mockConsole,
        plugins: [
          ...makeReactNativeTrackerDefaultPluginsList(trackerConfig),
          new ContextsFromReactNavigationPlugin({ ...trackerConfig, navigationContainerRef }),
        ],
      });
      const Stack = createStackNavigator();
      const HomeScreen = () => <TrackedLink {...linkProps} testID="test" />;
      const DestinationScreen = () => <>yup</>;
      const { getByTestId } = render(
        <NavigationContainer ref={navigationContainerRef}>
          <ObjectivProvider tracker={tracker}>
            <Stack.Navigator>
              <Stack.Screen name="HomeScreen" component={HomeScreen} />
              <Stack.Screen name="DestinationScreen" component={DestinationScreen} />
            </Stack.Navigator>
          </ObjectivProvider>
        </NavigationContainer>
      );

      fireEvent.press(getByTestId('test'));

      expect(spyTransport.handle).toHaveBeenCalledTimes(2);
      expect(spyTransport.handle).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          _type: 'ApplicationLoadedEvent',
          global_contexts: [
            expect.objectContaining({ _type: 'ApplicationContext', id: 'app-id' }),
            expect.objectContaining({ _type: 'PathContext', ...pathContext }),
          ],
          location_stack: [expect.objectContaining({ _type: 'RootLocationContext', ...rootLocationContext })],
        })
      );
      expect(spyTransport.handle).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          _type: 'PressEvent',
          global_contexts: [
            expect.objectContaining({ _type: 'ApplicationContext', id: 'app-id' }),
            expect.objectContaining({ _type: 'PathContext', ...pathContext }),
          ],
          location_stack: [
            expect.objectContaining({ _type: 'RootLocationContext', ...rootLocationContext }),
            expect.objectContaining({ _type: 'LinkContext', ...linkContext }),
          ],
        })
      );
    });
  });

  it('should console.error if an id cannot be automatically generated', () => {
    const tracker = new ReactNativeTracker({ applicationId: 'app-id', transport: spyTransport, console: mockConsole });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const Stack = createStackNavigator();
    const HomeScreen = () => (
      <ContentContextWrapper id="content">
        <TrackedLink to="/HomeScreen">🏡</TrackedLink>
      </ContentContextWrapper>
    );
    const DestinationScreen = () => <>yup</>;
    const navigationContainerRef = createNavigationContainerRef();
    render(
      <NavigationContainer ref={navigationContainerRef}>
        <ObjectivProvider tracker={tracker}>
          <RootLocationContextWrapper id="root">
            <Stack.Navigator>
              <Stack.Screen name="HomeScreen" component={HomeScreen} />
              <Stack.Screen name="DestinationScreen" component={DestinationScreen} />
            </Stack.Navigator>
          </RootLocationContextWrapper>
        </ObjectivProvider>
      </NavigationContainer>
    );

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      '｢objectiv｣ Could not generate a valid id for PressableContext @ RootLocation:root / Content:content. Please provide the `id` property manually.'
    );
  });

  it('should execute the given onPress as well', async () => {
    const tracker = new ReactNativeTracker({ applicationId: 'app-id', transport: spyTransport, console: mockConsole });
    const onPressSpy = jest.fn();

    const Stack = createStackNavigator();
    const HomeScreen = () => (
      <TrackedLink testID="test" to="/HomeScreen" onPress={onPressSpy}>
        Press me!
      </TrackedLink>
    );
    const DestinationScreen = () => <>yup</>;
    const navigationContainerRef = createNavigationContainerRef();
    const { getByTestId } = render(
      <NavigationContainer ref={navigationContainerRef}>
        <ObjectivProvider tracker={tracker}>
          <Stack.Navigator>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="DestinationScreen" component={DestinationScreen} />
          </Stack.Navigator>
        </ObjectivProvider>
      </NavigationContainer>
    );

    fireEvent.press(getByTestId('test'));

    expect(onPressSpy).toHaveBeenCalledTimes(1);
  });

  it('should fallback to RootLocationContext:home when a route cannot be detected', async () => {
    const navigationContainerRef = createNavigationContainerRef();
    const trackerConfig = {
      applicationId: 'app-id',
      transport: spyTransport,
      console: mockConsole,
    };
    const tracker = new ReactNativeTracker({
      applicationId: 'app-id',
      transport: spyTransport,
      console: mockConsole,
      plugins: [
        ...makeReactNativeTrackerDefaultPluginsList(trackerConfig),
        new ContextsFromReactNavigationPlugin({ ...trackerConfig, navigationContainerRef }),
      ],
    });
    const { getByTestId } = render(
      <NavigationContainer ref={navigationContainerRef}>
        <ObjectivProvider tracker={tracker}>
          <TrackedLink testID="test" to="/HomeScreen">
            Press me!
          </TrackedLink>
        </ObjectivProvider>
      </NavigationContainer>
    );

    fireEvent.press(getByTestId('test'));

    expect(spyTransport.handle).toHaveBeenCalledTimes(2);
    expect(spyTransport.handle).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        _type: 'ApplicationLoadedEvent',
        global_contexts: [
          expect.objectContaining({ _type: 'ApplicationContext', id: 'app-id' }),
          expect.objectContaining({ _type: 'PathContext', id: '/' }),
        ],
        location_stack: [expect.objectContaining({ _type: 'RootLocationContext', id: 'home' })],
      })
    );
    expect(spyTransport.handle).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        _type: 'PressEvent',
        location_stack: [
          expect.objectContaining({ _type: 'RootLocationContext', id: 'home' }),
          expect.objectContaining({ _type: 'LinkContext', id: 'press-me', href: '/HomeScreen' }),
        ],
      })
    );
  });

  it('should correctly generate RootLocation and Path Contexts with nested navigators', async () => {
    const navigationContainerRef = createNavigationContainerRef();
    const trackerConfig = {
      applicationId: 'app-id',
      transport: spyTransport,
      console: mockConsole,
    };
    const tracker = new ReactNativeTracker({
      applicationId: 'app-id',
      transport: spyTransport,
      console: mockConsole,
      plugins: [
        ...makeReactNativeTrackerDefaultPluginsList(trackerConfig),
        new ContextsFromReactNavigationPlugin({ ...trackerConfig, navigationContainerRef }),
      ],
    });
    const Tab = createBottomTabNavigator();
    const Stack = createStackNavigator();

    /**
     * Example taken from here: https://reactnavigation.org/docs/nesting-navigators
     * Stack.Navigator
     *   Home (Tab.Navigator)
     *     Feed (Screen)
     *     Messages (Screen)
     *   Profile (Screen)
     *   Settings (Screen)
     */

    const Feed = () => (
      <TrackedLink testID="go-to-home-from-feed" to="/Home">
        Go to Home
      </TrackedLink>
    );

    const Messages = () => (
      <TrackedLink testID="go-to-home-from-messages" to="/Home">
        Go to Home
      </TrackedLink>
    );

    const Profile = () => (
      <TrackedLink testID="go-to-home-from-profile" to="/Home">
        Go to Home
      </TrackedLink>
    );

    const Settings = () => (
      <TrackedLink testID="go-to-home-from-settings" to="/Home">
        Go to Home
      </TrackedLink>
    );

    const Home = () => (
      <Tab.Navigator initialRouteName={'Messages'}>
        <Tab.Screen name="Feed" component={Feed} />
        <Tab.Screen name="Messages" component={Messages} />
      </Tab.Navigator>
    );

    const { getByTestId } = render(
      <NavigationContainer ref={navigationContainerRef}>
        <ObjectivProvider tracker={tracker}>
          <Stack.Navigator initialRouteName={'Home'}>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Settings" component={Settings} />
          </Stack.Navigator>
        </ObjectivProvider>
      </NavigationContainer>
    );

    fireEvent.press(getByTestId('go-to-home-from-messages'));

    expect(spyTransport.handle).toHaveBeenCalledTimes(2);
    expect(spyTransport.handle).toHaveBeenCalledTimes(2);
    expect(spyTransport.handle).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        _type: 'ApplicationLoadedEvent',
        global_contexts: [
          expect.objectContaining({ _type: 'ApplicationContext', id: 'app-id' }),
          expect.objectContaining({ _type: 'PathContext', id: '/Home/Messages' }),
        ],
        location_stack: [expect.objectContaining({ _type: 'RootLocationContext', id: 'Messages' })],
      })
    );
    expect(spyTransport.handle).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        _type: 'PressEvent',
        global_contexts: [
          expect.objectContaining({ _type: 'ApplicationContext', id: 'app-id' }),
          expect.objectContaining({ _type: 'PathContext', id: '/Home/Messages' }),
        ],
        location_stack: [
          expect.objectContaining({ _type: 'RootLocationContext', id: 'Messages' }),
          expect.objectContaining({ _type: 'LinkContext', id: 'go-to-home', href: '/Home' }),
        ],
      })
    );
  });
});
