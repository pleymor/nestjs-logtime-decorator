import { Logger } from '@nestjs/common';

export type ContextSource = 'Request' | 'Response';
type MeasureTimeContext = { from: ContextSource; key: string }[];

function getContextString(
  context: MeasureTimeContext,
  requestArgs: unknown[],
  response?: any,
) {
  return context
    .map((c) => {
      if (c.from === 'Request') {
        return `${c.key}: ${requestArgs[0][c.key]}`;
      } else if (c.from === 'Response') {
        return `${c.key}: ${response[c.key]}`;
      } else {
        throw new Error(`Invalid context from: ${c.from}`);
      }
    })
    .join(', ');
}

/**
 * Decorator to log the time an async method takes to execute.
 * Only work on methods of a class.
 * Always place it AFTER the @Get, @Post, @Put, @Delete, etc. decorators.
 */
export function MeasureTimeAsync(
  options: {
    context: MeasureTimeContext;
  } = {
    context: [],
  },
) {
  return (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: any[]) => Promise<any>>,
  ) => {
    const original: (...args: Array<unknown>) => unknown = descriptor.value;

    const timeLabel = propertyKey;
    descriptor.value = async function (...args: Array<unknown>) {
      const startTime = Date.now();
      const responseBody = await original.apply(this, args);

      const contextStr = getContextString(options.context, args, responseBody);

      Logger.log(
        `${contextStr ? `[${contextStr}]` : ''} ${timeLabel} took ${
          Date.now() - startTime
        }ms`,
        target.constructor.name,
      );

      return responseBody;
    };
  };
}

/**
 * Decorator to log the time a sync method takes to execute.
 * Only work on methods of a class.
 * Always place it AFTER the @Get, @Post, @Put, @Delete, etc. decorators.
 */
export function MeasureTime(
  options: {
    context: MeasureTimeContext;
  } = {
    context: [],
  },
) {
  return (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: any[]) => any>,
  ) => {
    const original: (...args: Array<unknown>) => unknown = descriptor.value;

    const timeLabel = propertyKey;
    descriptor.value = function (...args: Array<unknown>) {
      const startTime = Date.now();
      const value: unknown = original.apply(this, args);

      const contextStr = getContextString(options.context, args, value);

      Logger.log(
        `[${contextStr}] ${timeLabel} took ${Date.now() - startTime}ms`,
        target.constructor.name,
      );

      return value;
    };
  };
}
