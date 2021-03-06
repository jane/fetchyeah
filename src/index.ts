import { globalFetch as f } from './util'

type _Headers = { [key: string]: string }
type Diff<T, U> = T extends U ? {} : T
type Opts<T> = Diff<RequestInit, { body?: BodyInit }> & {
  body?: T
  headers?: _Headers
}

type Method =
  | 'ACL'
  | 'BIND'
  | 'CHECKOUT'
  | 'CONNECT'
  | 'COPY'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'LINK'
  | 'LOCK'
  | 'M-SEARCH'
  | 'MERGE'
  | 'MKACTIVITY'
  | 'MKCALENDAR'
  | 'MKCOL'
  | 'MOVE'
  | 'NOTIFY'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'PURGE'
  | 'PUT'
  | 'REBIND'
  | 'REPORT'
  | 'SEARCH'
  | 'SOURCE'
  | 'SUBSCRIBE'
  | 'TRACE'
  | 'UNBIND'
  | 'UNLINK'
  | 'UNLOCK'
  | 'UNSUBSCRIBE'

export const trim = (s: string): string => s.trim()

export const eq = <T>(expected: T): ((a: T) => boolean) => (actual) =>
  expected === actual

export const hasJsonBody = (res: Response): boolean => {
  const contentType = res.headers.get('content-type')
  return (
    contentType != null &&
    contentType.split(';').map(trim).some(eq('application/json'))
  )
}

export type SimpleResponse<T> = {
  ok: boolean
  status: number
  headers: Headers
  body: T
}

export const toSimpleResponse = <T>(
  res: Response,
  body: T
): SimpleResponse<T> => ({
  ok: res.ok,
  status: res.status,
  headers: res.headers,
  body,
})

export const getBodyOrFail = <T>(res: SimpleResponse<T>): Promise<T> =>
  res.ok ? Promise.resolve(res.body) : Promise.reject(res.body)

const decodeJsonOrNull = <T>(res): Promise<T | void> =>
  res.json().catch((e): null => {
    // eslint-disable-next-line no-console
    console.warn('Malformed JSON response received.', res, e)
    return null
  })

// Performs an ajax call with headers and
// includes full response object. If given, the request
// body will be JSON stringified and any response body
// will be parsed as JSON.
export const sendJsonR = <ReqT extends {}, ResT>(
  method: Method,
  url: string,
  options: Opts<ReqT> = {}
): Promise<SimpleResponse<ResT | void>> =>
  Promise.resolve().then(
    (): Promise<SimpleResponse<ResT | void>> => {
      // @ts-ignore headers
      const { body, headers, ...innerOptions } = options
      const innerHeaders = headers ? new Headers(headers) : new Headers()
      innerHeaders.append('accept', 'application/json; charset=utf-8')
      let innerBody: string | void
      if (body) {
        innerHeaders.append('content-type', 'application/json; charset=utf-8')
        innerBody = JSON.stringify(body)
      }
      const credentials = 'include'
      return f(url, {
        method,
        credentials,
        // @ts-ignore body
        body: innerBody,
        headers: innerHeaders,
        ...innerOptions,
      }).then(
        (res): Promise<SimpleResponse<ResT | void>> => {
          const bodyP: Promise<ResT | void> = hasJsonBody(res)
            ? decodeJsonOrNull(res)
            : Promise.resolve(null)
          return bodyP.then((body) => toSimpleResponse(res, body))
        }
      )
    }
  )

// Performs an ajax call with headers, returning
// only the response body. If given, the request
// body will be JSON stringified and any response body
// will be parsed as JSON.
export const sendJson = <ReqT extends {}, ResT>(
  method: Method,
  url: string,
  options?: Opts<ReqT>
  // @ts-ignore
): Promise<ResT | void> => sendJsonR(method, url, options).then(getBodyOrFail)

// Helpers for sendJson which apply a method.
export const del = <ReqT extends {}, ResT>(
  url: string,
  options?: Opts<ReqT>
): Promise<ResT | void> => sendJson('DELETE', url, options)

export const get = <ReqT extends {}, ResT>(
  url: string,
  options?: Opts<ReqT>
): Promise<ResT | void> => sendJson('GET', url, options)

export const head = <ReqT extends {}, ResT>(
  url: string,
  options?: Opts<ReqT>
): Promise<SimpleResponse<ResT | void>> => sendJsonR('HEAD', url, options)

export const patch = <ReqT extends {}, ResT>(
  url: string,
  options?: Opts<ReqT>
): Promise<ResT | void> => sendJson('PATCH', url, options)

export const post = <ReqT extends {}, ResT>(
  url: string,
  options?: Opts<ReqT>
): Promise<ResT | void> => sendJson('POST', url, options)

export const put = <ReqT extends {}, ResT>(
  url: string,
  options?: Opts<ReqT>
): Promise<ResT | void> => sendJson('PUT', url, options)
