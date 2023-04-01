import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

const methods = ['get', 'post'] as const;

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  __consoleLogger?: {
    uri: string;
    operationId: number;
    startTime: number;
  };
}

type RequestKey = keyof AxiosRequestConfig;
type ResponseKey = keyof AxiosResponse;

const defaultOptions: Required<AxiosConsoleLoggerOptions> = {
  colors: {
    get: {
      request: '#54b7d3',
      response: '#408ba1',
    },
    post: {
      request: '#96c750',
      response: '#6f943b',
    },
  },
  multiline: false,
  responseSize: true,
  responseTime: true,
  requestKeys: ['params', 'data'],
  responseKeys: ['data'],
};

interface AxiosConsoleLoggerOptions {
  colors?: {
    get?: {
      request: string;
      response: string;
    };
    post?: {
      request: string;
      response: string;
    };
  };
  multiline?: boolean;
  responseSize?: boolean;
  responseTime?: boolean;
  requestKeys?: RequestKey[];
  responseKeys?: ResponseKey[];
}

export class AxiosConsoleLogger {
  private logId = 0;
  private options: Required<AxiosConsoleLoggerOptions>;

  constructor(options?: AxiosConsoleLoggerOptions) {
    this.options = {
      colors: {
        get: options?.colors?.get ?? defaultOptions?.colors?.get,
        post: options?.colors?.post ?? defaultOptions?.colors?.post,
      },
      multiline: options?.multiline ?? defaultOptions.multiline,
      responseSize: options?.responseSize ?? defaultOptions.responseSize,
      responseTime: options?.responseTime ?? defaultOptions.responseTime,
      requestKeys: options?.requestKeys ?? defaultOptions.requestKeys,
      responseKeys: options?.responseKeys ?? defaultOptions.responseKeys,
    };
  }

  request(
    request: CustomAxiosRequestConfig,
  ): CustomAxiosRequestConfig | Promise<CustomAxiosRequestConfig> {
    const operationId = ++this.logId;

    this._logRequest(request, operationId);

    request.__consoleLogger = {
      uri: axios.getUri(request),
      operationId,
      startTime: this.options.responseTime ? Date.now() : 0,
    };

    return request;
  }

  response(response: AxiosResponse): AxiosResponse | Promise<AxiosResponse> {
    this._logResponse(response);
    return response;
  }

  error(error: AxiosError): AxiosError | Promise<AxiosError> {
    this._logError(error);
    return Promise.reject(error);
  }

  protected _logRequest(
    operation: InternalAxiosRequestConfig,
    operationId: number,
  ) {
    const result: Partial<Record<RequestKey, any>> = {};

    this.options.requestKeys?.map((key) => {
      if (!isEmpty(operation[key])) {
        result[key] = operation[key];
      }
    });

    console.debug(
      '%c >> ' +
        operation.method?.toUpperCase() +
        ' #' +
        operationId +
        ' %c %c' +
        axios.getUri(operation) +
        '%c' +
        (this.options.multiline ? '\n' : ''),
      'background: ' +
        (operation.method && operation.method in (defaultOptions.colors ?? [])
          ? this.options.colors?.[operation.method as typeof methods[number]]
              ?.request
          : '#aaaaaa') +
        '; padding: 2px; color: #ffffff; border-radius: 3px;',
      undefined,
      'color: inherit; font-weight: bold;',
      undefined,
      result,
    );
  }

  protected _logResponse(operation: AxiosResponse, error?: AxiosError) {
    const consoleLogger = (operation.config as CustomAxiosRequestConfig)
      .__consoleLogger;

    if (!consoleLogger) {
      return;
    }

    const result: Partial<Record<ResponseKey, any>> = {};

    this.options.responseKeys?.map((key) => {
      if (!isEmpty(operation[key])) {
        result[key] = operation[key];
      }
    });

    console.debug(
      '%c << ' +
        operation.config.method?.toUpperCase() +
        ' #' +
        consoleLogger.operationId +
        ' %c ' +
        (error ? '⚠️ ' : '') +
        `%c${consoleLogger.uri}%c` +
        (this.options.responseSize
          ? ` %c${
              Math.round(
                ((JSON.stringify(operation.data)?.length +
                  JSON.stringify(operation.headers)?.length) /
                  1024) *
                  10,
              ) / 10
            } kB`
          : '%c') +
        '%c' +
        (this.options.responseTime
          ? ` %c${Date.now() - consoleLogger.startTime} ms`
          : '%c') +
        '%c' +
        (this.options.multiline ? '\n' : ''),
      'background: ' +
        (operation.config.method &&
        operation.config.method in (defaultOptions.colors ?? [])
          ? this.options.colors?.[
              operation.config.method as typeof methods[number]
            ]?.response
          : '#888888') +
        '; padding: 2px; color: #ffffff; border-radius: 3px;',
      undefined,
      'font-weight: bold;' +
        (!error ? 'color: #008000;' : 'background: #FFD6D6;'),
      undefined,
      this.options.responseSize
        ? 'background: #e4e4e4; padding: 2px 4px; border-radius: 3px; font-size: 11px;'
        : undefined,
      undefined,
      this.options.responseTime
        ? 'background: #e4e4e4; padding: 2px 4px; border-radius: 3px; font-size: 11px;'
        : undefined,
      undefined,
      result,
    );
  }

  protected _logError(error: AxiosError) {
    const operation = error.response;

    if (!operation) {
      return;
    }

    this._logResponse(operation, error);
  }
}

function isEmpty(value: unknown) {
  if (!value) {
    return true;
  }

  if (typeof value === 'object') {
    return !Object.keys(value).length;
  }

  return false;
}
