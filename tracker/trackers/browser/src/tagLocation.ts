import { generateUUID, getObjectKeys } from '@objectiv/tracker-core';
import { create, is, validate } from 'superstruct';
import {
  AnyClickableContext,
  AnySectionContext,
  InputContext,
  stringifyLocationContext,
} from './definitions/LocationContext';
import { TaggingAttribute } from './definitions/TaggingAttribute';
import {
  StringifiedTaggingAttributes,
  stringifyTrackClicksAttribute,
  stringifyTrackVisibilityAttribute,
  stringifyValidateAttribute,
} from './definitions/TaggingAttributes';
import { TagLocationParameters } from './definitions/TagLocationParameters';
import { TagLocationReturnValue } from './definitions/TagLocationReturnValue';
import { runIfValueIsNotUndefined } from './helpers/runIfValueIsNotUndefined';
import { trackerErrorHandler } from './helpers/trackerErrorHandler';

/**
 * Used to decorate a Taggable Element with our Tagging Attributes.
 *
 * Returns an object containing the Tagging Attributes. It's properties are supposed to be spread on the target HTML
 * Element. This allows us to identify elements uniquely in a Document and to reconstruct their Location.
 *
 * For a higher level api see the tagLocationHelpers module.
 *
 * Examples
 *
 *    tagLocation({ instance: makeElementContext({ id: 'section-id' }) })
 *    tagLocation({ instance: makeElementContext({ id: 'section-id' }), { trackClicks: true } })
 *
 */
export const tagLocation = (parameters: TagLocationParameters): TagLocationReturnValue => {
  try {
    // Validate input
    const { instance, options } = create(parameters, TagLocationParameters);

    // Determine Context type
    const isClickable = is(instance, AnyClickableContext);
    const isInput = is(instance, InputContext);
    const isSection = is(instance, AnySectionContext);

    // Process options. Gather default attribute values
    const trackClicks = options?.trackClicks ?? (isClickable ? true : undefined);
    const trackBlurs = options?.trackBlurs ?? (isInput ? true : undefined);
    const trackVisibility = options?.trackVisibility ?? (isSection ? { mode: 'auto' } : undefined);
    const parentElementId = options?.parent ? options.parent[TaggingAttribute.elementId] : undefined;

    // Create output attributes object
    const taggingAttributes = {
      [TaggingAttribute.elementId]: generateUUID(),
      [TaggingAttribute.parentElementId]: parentElementId,
      [TaggingAttribute.context]: stringifyLocationContext(instance),
      [TaggingAttribute.trackClicks]: runIfValueIsNotUndefined(stringifyTrackClicksAttribute, trackClicks),
      [TaggingAttribute.trackBlurs]: runIfValueIsNotUndefined(JSON.stringify, trackBlurs),
      [TaggingAttribute.trackVisibility]: runIfValueIsNotUndefined(stringifyTrackVisibilityAttribute, trackVisibility),
      [TaggingAttribute.validate]: runIfValueIsNotUndefined(stringifyValidateAttribute, options?.validate),
    };

    // Validate
    validate(taggingAttributes, StringifiedTaggingAttributes);

    // Strip out undefined attributes and return
    getObjectKeys(taggingAttributes).forEach((key) => {
      if (taggingAttributes[key] === undefined) {
        delete taggingAttributes[key];
      }
    });

    return taggingAttributes;
  } catch (error) {
    return trackerErrorHandler(error, parameters, parameters?.onError);
  }
};
