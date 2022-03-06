import {
  ContextsConfig,
  makeRootLocationContext,
  TrackerConsole,
  TrackerPluginConfig,
  TrackerPluginInterface,
} from '@objectiv/tracker-core';
import { makeRootLocationId } from './makeRootLocationId';

/**
 * The configuration object of RootLocationContextFromURLPlugin.
 */
export type RootLocationContextFromURLPluginConfig = TrackerPluginConfig & {
  idFactoryFunction?: typeof makeRootLocationId;
};

/**
 * The RootLocationContextFromURL Plugin factors a RootLocationContext out of the first slug of the current URL.
 */
export class RootLocationContextFromURLPlugin implements TrackerPluginInterface {
  readonly console?: TrackerConsole;
  readonly pluginName = `RootLocationContextFromURLPlugin`;
  readonly idFactoryFunction: typeof makeRootLocationId;

  /**
   * The constructor is responsible for processing the given TrackerPluginConfiguration and initializing validation.
   */
  constructor(config?: RootLocationContextFromURLPluginConfig) {
    this.console = config?.console;
    this.idFactoryFunction = config?.idFactoryFunction ?? makeRootLocationId;

    if (this.console) {
      this.console.log(`%c｢objectiv:${this.pluginName}｣ Initialized`, 'font-weight: bold');
    }
  }

  /**
   * Generate a fresh RootLocationContext before each TrackerEvent is handed over to the TrackerTransport.
   */
  enrich(contexts: Required<ContextsConfig>): void {
    const rootLocationContextId = this.idFactoryFunction();

    if (rootLocationContextId) {
      contexts.location_stack.unshift(makeRootLocationContext({ id: rootLocationContextId }));
    } else if (this.console) {
      this.console.error(
        `%c｢objectiv:${this.pluginName}｣ Could not generate a RootLocationContext from "${location.pathname}"`,
        'font-weight: bold'
      );
    }
  }

  /**
   * Make this plugin usable only on web, eg: Document and Location APIs are both available
   */
  isUsable(): boolean {
    return typeof document !== 'undefined' && typeof document.location !== 'undefined';
  }
}
