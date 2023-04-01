# Axios Console Logger

[![npm version](https://img.shields.io/npm/v/@freewall/axios-console-logger?color=blue)](https://www.npmjs.com/@freewall/axios-console-logger)
[![publish status](https://img.shields.io/github/actions/workflow/status/FreeWall/axios-console-logger/publish.yml)](https://github.com/FreeWall/axios-console-logger/releases/latest)

A console logger for Axios HTTP client.

## Installation

```shell
npm install @freewall/axios-console-logger
```

## Usage

```js
import { AxiosConsoleLogger } from '@freewall/axios-console-logger';

const logger = new AxiosConsoleLogger();

axios.interceptors.request.use((request) => logger.request(request));

axios.interceptors.response.use(
  (response) => logger.response(response),
  (error) => logger.error(error),
);
```

### Options

```js
// default values:
new AxiosConsoleLogger({
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
});
```
