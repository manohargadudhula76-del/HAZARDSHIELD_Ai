const fs = require('fs');
const http = require('http');

global.window = global;
global.Node = class Node {};
global.Element = class Element {};
global.HTMLElement = class HTMLElement extends global.Element {};
global.HTMLIFrameElement = class HTMLIFrameElement extends global.HTMLElement {};
const mockEl = () => ({
  nodeType: 1,
  appendChild: () => {},
  removeChild: () => {},
  setAttribute: () => {},
  getAttribute: () => null,
  innerHTML: '',
  style: {},
  addEventListener: () => {},
  removeEventListener: () => {},
  ownerDocument: global.document,
});
global.document = {
  nodeType: 9,
  getElementById: mockEl,
  querySelector: mockEl,
  querySelectorAll: () => [],
  createElement: mockEl,
  getElementsByTagName: () => [],
  createTextNode: (s) => ({ nodeType: 3, textContent: s }),
  createComment: () => ({ nodeType: 8 }),
  addEventListener: () => {},
  removeEventListener: () => {},
  documentElement: { style: {} },
};
global.navigator = { userAgent: 'node' };

const path = require('path');
const SwaggerUIBundle = require(path.resolve(__dirname, '../swagger-ui-bundle.js'));

http.get('http://127.0.0.1:8000/api/v1/openapi.json', (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    const spec = JSON.parse(raw);
    const ui = SwaggerUIBundle({
      spec: spec,
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset,
      ],
    });

    console.log('SwaggerUI system initialized.');
    setTimeout(() => {
      const system = ui;
      const fn = system.fn;
      console.log('Available fn keys:', Object.keys(fn));

      // Test getSampleSchema on every schema in components.schemas
      for (const [name, schema] of Object.entries(spec.components.schemas)) {
        try {
          // Test with jsonSchema202012 or fn.getSampleSchema
          if (fn.jsonSchema202012 && fn.jsonSchema202012.getSampleSchema) {
            fn.jsonSchema202012.getSampleSchema(schema, 'application/json', { includeReadOnly: true });
          }
          if (fn.getSampleSchema) {
            fn.getSampleSchema(schema, 'application/json', { includeReadOnly: true });
          }
        } catch (e) {
          console.error(`FAILED sample schema on ${name}:`, e.message);
          console.error(e.stack);
        }
      }

      // Now test each operation response
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        for (const [method, op] of Object.entries(pathItem)) {
          if (!op.responses) continue;
          for (const [code, resp] of Object.entries(op.responses)) {
            if (resp.content && resp.content['application/json'] && resp.content['application/json'].schema) {
              const rSchema = resp.content['application/json'].schema;
              try {
                if (fn.jsonSchema202012 && fn.jsonSchema202012.getSampleSchema) {
                  fn.jsonSchema202012.getSampleSchema(rSchema, 'application/json', { includeReadOnly: true });
                }
                if (fn.getSampleSchema) {
                  fn.getSampleSchema(rSchema, 'application/json', { includeReadOnly: true });
                }
              } catch (e) {
                console.error(`FAILED operation response sample on ${method.toUpperCase()} ${path} [${code}]:`, e.message);
                console.error(e.stack);
              }
            }
          }
        }
      }

      console.log('Sample schema checks finished.');
    }, 500);
  });
});
