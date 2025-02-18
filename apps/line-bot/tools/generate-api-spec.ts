import { OpenAPIHono } from '@hono/zod-openapi';
import * as fs from 'fs';
import packageJson from '../package.json';
import { listenerLettersApi } from '../src/api/liff/listener-letters';

const app = new OpenAPIHono();

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});

app.route('/api/liff/listener-letters', listenerLettersApi);

const openAPIObjectConfig = {
  openapi: '3.0.0',
  externalDocs: {
    description: 'Tech Post Cast LIFF API',
    url: 'http://localhost:8787',
  },
  info: {
    version: packageJson.version,
    title: 'Tech Post Cast LIFF API',
  },
  servers: [
    {
      url: 'http://localhost:8787/',
      description: 'Local server',
    },
  ],
};

const openApiSpecObject = app.getOpenAPIDocument(openAPIObjectConfig);
fs.writeFileSync(
  'api-spec/liff-api-spec.json',
  JSON.stringify(openApiSpecObject, undefined, 2),
);
