import axios, {
  AxiosError,
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

const defaultOptions: AxiosConsoleLoggerOptions = {
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
  timings: true,
  sizes: true,
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
  timings?: boolean;
  sizes?: boolean;
}

export class AxiosConsoleLogger {
  private logId = 0;
  private options: AxiosConsoleLoggerOptions;

  constructor(options?: AxiosConsoleLoggerOptions) {
    this.options = {
      colors: {
        get: options?.colors?.get ?? defaultOptions?.colors?.get,
        post: options?.colors?.post ?? defaultOptions?.colors?.post,
      },
      timings: options?.timings ?? defaultOptions.timings,
      sizes: options?.sizes ?? defaultOptions.sizes,
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
      startTime: this.options.timings ? Date.now() : 0,
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
    console.debug(
      '%c >> ' +
        operation.method?.toUpperCase() +
        ' #' +
        operationId +
        ' %c %c' +
        axios.getUri(operation) +
        '%c',
      'background: ' +
        (operation.method && operation.method in (defaultOptions.colors ?? [])
          ? this.options.colors?.[operation.method as typeof methods[number]]
              ?.request
          : '#aaaaaa') +
        '; padding: 2px; color: #ffffff; border-radius: 3px;',
      undefined,
      'color: inherit; font-weight: bold;',
      undefined,
      {
        ...(isEmpty(operation.params) ? null : { params: operation.params }),
        ...(isEmpty(operation.data) ? null : { data: operation.data }),
      },
    );
  }

  protected _logResponse(operation: AxiosResponse, error?: AxiosError) {
    const success = !error;
    const consoleLogger = (operation.config as CustomAxiosRequestConfig)
      .__consoleLogger;

    if (!consoleLogger) {
      return;
    }

    console.debug(
      '%c << ' +
        operation.config.method?.toUpperCase() +
        ' #' +
        consoleLogger.operationId +
        ' %c ' +
        (!success ? '⚠️ ' : '') +
        `%c${consoleLogger.uri}%c` +
        (this.options.timings
          ? ` %c${Date.now() - consoleLogger.startTime} ms`
          : '%c') +
        '%c' +
        (this.options.sizes
          ? ` %c${
              Math.round(
                ((JSON.stringify(operation.data)?.length +
                  JSON.stringify(operation.headers)?.length) /
                  1024) *
                  10,
              ) / 10
            } kB`
          : '%c'),
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
        (success ? 'color: #008000;' : 'background: #FFD6D6;'),
      undefined,
      this.options.timings
        ? 'background: #e4e4e4; padding: 2px 4px; border-radius: 3px; font-size: 11px;'
        : undefined,
      undefined,
      this.options.sizes
        ? 'background: #e4e4e4; padding: 2px 4px; border-radius: 3px; font-size: 11px;'
        : undefined,
      operation.data,
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

  return true;
}
