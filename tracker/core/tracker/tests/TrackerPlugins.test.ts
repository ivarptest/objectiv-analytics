/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { TrackerEvent, TrackerPluginInterface, TrackerPlugins } from '../src';

describe('Plugin', () => {
  it('should instantiate when specifying an empty list of Plugins', () => {
    const testPlugins = new TrackerPlugins({ plugins: [] });
    expect(testPlugins).toBeInstanceOf(TrackerPlugins);
    expect(testPlugins).toEqual({ plugins: [] });
  });

  it('should instantiate when specifying a list of Plugins instances', () => {
    const plugins: TrackerPluginInterface[] = [
      { pluginName: 'test-pluginA', isUsable: () => true },
      { pluginName: 'test-pluginB', isUsable: () => true },
    ];
    const testPlugins = new TrackerPlugins({ plugins });
    expect(testPlugins).toBeInstanceOf(TrackerPlugins);
    expect(testPlugins).toEqual({ plugins });
  });

  it('should not allow Plugins with the same name', () => {
    class TestPluginA implements TrackerPluginInterface {
      readonly pluginName = 'pluginA';
      readonly parameter?: string;

      constructor(args?: { parameter?: string }) {
        this.parameter = args?.parameter;
      }

      isUsable() {
        return true;
      }
    }
    expect(
      () =>
        new TrackerPlugins({
          plugins: [new TestPluginA(), new TestPluginA({ parameter: 'parameterValue1' })],
        })
    ).toThrow('｢objectiv:TrackerPlugins｣ pluginA: already exists. Use "replace" instead.');
  });

  it('should return false if a plugin does not exist', () => {
    const pluginA = { pluginName: 'test-pluginA', isUsable: () => true };
    const pluginB = { pluginName: 'test-pluginB', isUsable: () => true };
    const testPlugins = new TrackerPlugins({ plugins: [pluginA, pluginB] });
    expect(testPlugins.has('test-pluginA')).toBe(true);
    expect(testPlugins.has('test-pluginB')).toBe(true);
    expect(testPlugins.has('test-pluginC')).toBe(false);
  });

  it('should get a plugin by its name or return null', () => {
    const pluginA = { pluginName: 'test-pluginA', isUsable: () => true };
    const pluginB = { pluginName: 'test-pluginB', isUsable: () => true };
    const testPlugins = new TrackerPlugins({ plugins: [pluginA, pluginB] });
    expect(testPlugins.get('test-pluginA')).toBe(pluginA);
    expect(testPlugins.get('test-pluginB')).toBe(pluginB);
    expect(() => testPlugins.get('test-pluginC')).toThrow('｢objectiv:TrackerPlugins｣ test-pluginC: not found.');
  });

  it('should add plugins', () => {
    const pluginA = { pluginName: 'test-pluginA', isUsable: () => true };
    const pluginB = { pluginName: 'test-pluginB', isUsable: () => true };
    const pluginC = { pluginName: 'test-pluginC', isUsable: () => true };
    const testPlugins = new TrackerPlugins({ plugins: [] });
    testPlugins.add(pluginA);
    testPlugins.add(pluginB);
    expect(() => testPlugins.add(pluginB)).toThrow(
      '｢objectiv:TrackerPlugins｣ test-pluginB: already exists. Use "replace" instead.'
    );
    expect(testPlugins.plugins).toEqual([
      {
        isUsable: expect.any(Function),
        pluginName: 'test-pluginA',
      },
      {
        isUsable: expect.any(Function),
        pluginName: 'test-pluginB',
      },
    ]);
    testPlugins.add(pluginC, 1);
    expect(testPlugins.plugins).toEqual([
      {
        isUsable: expect.any(Function),
        pluginName: 'test-pluginA',
      },
      {
        isUsable: expect.any(Function),
        pluginName: 'test-pluginC',
      },
      {
        isUsable: expect.any(Function),
        pluginName: 'test-pluginB',
      },
    ]);
    expect(() => testPlugins.add(pluginC, -1)).toThrow('｢objectiv:TrackerPlugins｣ invalid index.');
    expect(() => testPlugins.add(pluginC, Infinity)).toThrow('｢objectiv:TrackerPlugins｣ invalid index.');
    // @ts-ignore
    expect(() => testPlugins.add(pluginC, '0')).toThrow('｢objectiv:TrackerPlugins｣ invalid index.');
  });

  it('should remove plugins', () => {
    const pluginA = { pluginName: 'test-pluginA', isUsable: () => true };
    const pluginB = { pluginName: 'test-pluginB', isUsable: () => true };
    const pluginC = { pluginName: 'test-pluginC', isUsable: () => true };
    const testPlugins = new TrackerPlugins({ plugins: [pluginA, pluginB, pluginC] });
    testPlugins.remove('test-pluginB');
    expect(testPlugins.plugins).toEqual([
      {
        isUsable: expect.any(Function),
        pluginName: 'test-pluginA',
      },
      {
        isUsable: expect.any(Function),
        pluginName: 'test-pluginC',
      },
    ]);
    expect(() => testPlugins.remove('test-pluginB')).toThrow('｢objectiv:TrackerPlugins｣ test-pluginB: not found.');
  });

  it('should replace plugins', () => {
    const pluginA = { pluginName: 'test-pluginA', isUsable: () => true, parameterA: false };
    const pluginB = { pluginName: 'test-pluginB', isUsable: () => true, parameterB: false };
    const pluginC = { pluginName: 'test-pluginC', isUsable: () => true, parameterC: false };
    const testPlugins = new TrackerPlugins({ plugins: [pluginA, pluginB, pluginC] });
    expect(testPlugins.plugins).toEqual([
      {
        parameterA: false,
        isUsable: expect.any(Function),
        pluginName: 'test-pluginA',
      },
      {
        parameterB: false,
        isUsable: expect.any(Function),
        pluginName: 'test-pluginB',
      },
      {
        parameterC: false,
        isUsable: expect.any(Function),
        pluginName: 'test-pluginC',
      },
    ]);
    const existingPlugin = testPlugins.get('test-pluginB');
    if (!existingPlugin) {
      throw new Error('test-pluginB Plugin not found');
    }
    const newPluginB1 = { ...existingPlugin, parameterB: true };
    expect(testPlugins.replace(newPluginB1)).toBe(true);
    expect(testPlugins.plugins).toEqual([
      {
        parameterA: false,
        isUsable: expect.any(Function),
        pluginName: 'test-pluginA',
      },
      {
        parameterB: true,
        isUsable: expect.any(Function),
        pluginName: 'test-pluginB',
      },
      {
        parameterC: false,
        isUsable: expect.any(Function),
        pluginName: 'test-pluginC',
      },
    ]);
    const newPluginD = { pluginName: 'test-pluginD', isUsable: () => true };
    expect(() => testPlugins.replace(newPluginD)).toThrow('｢objectiv:TrackerPlugins｣ test-pluginD: not found.');
    const newPluginB2 = { pluginName: 'test-pluginB', isUsable: () => true, newParameter: { a: 1 } };
    expect(testPlugins.replace(newPluginB2, 0)).toBe(true);
    expect(testPlugins.plugins).toEqual([
      {
        isUsable: expect.any(Function),
        newParameter: { a: 1 },
        pluginName: 'test-pluginB',
      },
      {
        parameterA: false,
        isUsable: expect.any(Function),
        pluginName: 'test-pluginA',
      },
      {
        parameterC: false,
        isUsable: expect.any(Function),
        pluginName: 'test-pluginC',
      },
    ]);
    expect(() => testPlugins.replace(newPluginB2, -1)).toThrow('｢objectiv:TrackerPlugins｣ invalid index.');
    expect(() => testPlugins.replace(newPluginB2, Infinity)).toThrow('｢objectiv:TrackerPlugins｣ invalid index.');
    // @ts-ignore
    expect(() => testPlugins.replace(newPluginB2, '0')).toThrow('｢objectiv:TrackerPlugins｣ invalid index.');
  });

  it('constructor should behave like `add`', () => {
    class TestPluginA implements TrackerPluginInterface {
      readonly pluginName = 'pluginA';
      readonly parameter?: string;

      constructor(args?: { parameter?: string }) {
        this.parameter = args?.parameter;
      }

      isUsable() {
        return true;
      }
    }
    expect(
      () =>
        new TrackerPlugins({
          plugins: [new TestPluginA(), new TestPluginA({ parameter: 'parameterValue' })],
        })
    ).toThrow('｢objectiv:TrackerPlugins｣ pluginA: already exists. Use "replace" instead.');
  });

  it('should execute all Plugins implementing the `beforeTransport` callback', () => {
    const pluginA: TrackerPluginInterface = {
      pluginName: 'pluginA',
      isUsable: () => true,
      beforeTransport: jest.fn(),
    };
    const pluginB: TrackerPluginInterface = {
      pluginName: 'pluginB',
      isUsable: () => true,
      beforeTransport: jest.fn(),
    };
    const pluginC: TrackerPluginInterface = { pluginName: 'pluginC', isUsable: () => true };
    const plugins: TrackerPluginInterface[] = [pluginA, pluginB, pluginC];
    const testPlugins = new TrackerPlugins({ plugins });
    expect(pluginA.beforeTransport).not.toHaveBeenCalled();
    expect(pluginB.beforeTransport).not.toHaveBeenCalled();
    const testEvent = new TrackerEvent({ _type: 'test-event' });
    testPlugins.beforeTransport(testEvent);
    expect(pluginA.beforeTransport).toHaveBeenCalledWith(testEvent);
    expect(pluginB.beforeTransport).toHaveBeenCalledWith(testEvent);
  });

  it('should execute only Plugins that are usable', () => {
    const pluginA: TrackerPluginInterface = {
      pluginName: 'pluginA',
      isUsable: () => true,
      beforeTransport: jest.fn(),
    };
    const pluginB: TrackerPluginInterface = {
      pluginName: 'test-pluginB',
      isUsable: () => false,
      beforeTransport: jest.fn(),
    };
    const pluginC: TrackerPluginInterface = {
      pluginName: 'pluginC',
      isUsable: () => true,
      beforeTransport: jest.fn(),
    };
    const plugins: TrackerPluginInterface[] = [pluginA, pluginB, pluginC];
    const testPlugins = new TrackerPlugins({ plugins });
    expect(pluginA.beforeTransport).not.toHaveBeenCalled();
    expect(pluginB.beforeTransport).not.toHaveBeenCalled();
    expect(pluginC.beforeTransport).not.toHaveBeenCalled();
    const testEvent = new TrackerEvent({ _type: 'test-event' });
    testPlugins.beforeTransport(testEvent);
    expect(pluginA.beforeTransport).toHaveBeenCalledWith(testEvent);
    expect(pluginB.beforeTransport).not.toHaveBeenCalled();
    expect(pluginC.beforeTransport).toHaveBeenCalledWith(testEvent);
  });
});
