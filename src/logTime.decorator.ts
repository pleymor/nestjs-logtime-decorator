import { Logger } from '@nestjs/common'

export type ContextSource = 'Request' | 'Response'
type MeasureTimeContext = { from: ContextSource; key: string }[]

function getContextString(
  context: MeasureTimeContext,
  requestArgs: any[],
  response?: any
) {
  return context
    .map((c) => {
      switch (c.from) {
        case 'Request':
          return `${c.key}: ${requestArgs[0][c.key]}`
        case 'Response':
          return `${c.key}: ${response[c.key]}`
        default:
          throw new Error(`Invalid context from: ${c.from}`)
      }
    })
    .join(', ')
}

/**
 * Log the time a method takes to execute.
 */
function logTime(
  options: {
    context: MeasureTimeContext
  },
  args: unknown[],
  responseBody: string,
  timeLabel: string,
  isError: boolean,
  startTime: number,
  target: any
) {
  const contextStr = getContextString(options.context, args, responseBody)

  Logger.log(
    `${contextStr ? `[${contextStr}]` : ''} ${timeLabel} ${
      isError ? '(error) ' : ''
    }took ${Date.now() - startTime}ms`,
    target.constructor.name
  )
}

/**
 * Decorator to log the time an async method takes to execute.
 * Only work on methods of a class.
 * Always place it AFTER the @Get, @Post, @Put, @Delete, etc. decorators.
 */
export function MeasureTimeAsync(
  options: {
    context: MeasureTimeContext
  } = {
    context: []
  }
) {
  return (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: any[]) => Promise<any>>
  ) => {
    const original: ((...params: any[]) => Promise<any>) | undefined =
      descriptor.value

    const timeLabel = propertyKey
    descriptor.value = async function (...args: Array<unknown>) {
      const startTime = Date.now()
      let responseBody = ''

      let isError = false
      try {
        responseBody = await original?.apply(this, args)
      } catch (e) {
        isError = true
        throw e
      } finally {
        logTime(
          options,
          args,
          responseBody,
          timeLabel,
          isError,
          startTime,
          target
        )
      }

      return responseBody
    }
  }
}

/**
 * Decorator to log the time a sync method takes to execute.
 * Only work on methods of a class.
 * Always place it AFTER the @Get, @Post, @Put, @Delete, etc. decorators.
 */
export function MeasureTime(
  options: {
    context: MeasureTimeContext
  } = {
    context: []
  }
) {
  return (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: any[]) => any>
  ) => {
    const original: ((...params: any[]) => any) | undefined = descriptor.value

    const timeLabel = propertyKey
    descriptor.value = function (...args: Array<unknown>) {
      const startTime = Date.now()
      let responseBody = ''

      let isError = false
      try {
        responseBody = original?.apply(this, args)
      } catch (e) {
        isError = true
        throw e
      } finally {
        logTime(
          options,
          args,
          responseBody,
          timeLabel,
          isError,
          startTime,
          target
        )
      }
    }
  }
}
