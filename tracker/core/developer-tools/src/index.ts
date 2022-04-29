/*
 * Copyright 2022 Objectiv B.V.
 */

import { TrackerDeveloperToolsInterface } from '@objectiv/tracker-core';
import { makeEventRecorder, recordedEvents } from './EventRecorder';
import { getLocationPath } from './getLocationPath';
import { LocationTree } from './LocationTree';
import { TrackerConsole } from './TrackerConsole';
import { makeGlobalContextValidationRule } from './validationRules/makeGlobalContextValidationRule';
import { makeLocationContextValidationRule } from './validationRules/makeLocationContextValidationRule';

/**
 * A global object containing all DeveloperTools
 */
const developerTools: TrackerDeveloperToolsInterface = {
  getLocationPath,
  LocationTree,
  makeEventRecorder,
  makeGlobalContextValidationRule,
  makeLocationContextValidationRule,
  recordedEvents,
  TrackerConsole,
};

/**
 * Extend or set global objectiv interface with developer tools
 */
globalThis.objectiv = { ...(globalThis.objectiv ?? {}), ...developerTools };
