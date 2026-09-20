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
  createElementNS: mockEl,
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

    setTimeout(() => {
      console.log('Testing sampleFromSchema on ExplainabilityListResponse:');
      try {
        const schema = spec.components.schemas.ExplainabilityListResponse;
        const sample1 = ui.fn.sampleFromSchema(schema, { includeReadOnly: true });
        console.log('Sample from ExplainabilityListResponse success! Size:', JSON.stringify(sample1).length);
      } catch (e) {
        console.error('CRASH in sampleFromSchema ExplainabilityListResponse:', e);
      }

      console.log('Testing sampleFromSchema on DistrictExplainabilityResponse:');
      try {
        const schema = spec.components.schemas.DistrictExplainabilityResponse;
        const sample2 = ui.fn.sampleFromSchema(schema, { includeReadOnly: true });
        console.log('Sample from DistrictExplainabilityResponse success! Size:', JSON.stringify(sample2).length);
      } catch (e) {
        console.error('CRASH in sampleFromSchema DistrictExplainabilityResponse:', e);
      }

      // Now test jsonSchema202012.sampleFromSchema
      if (ui.fn.jsonSchema202012 && ui.fn.jsonSchema202012.sampleFromSchema) {
        console.log('Testing jsonSchema202012.sampleFromSchema on DistrictExplainabilityResponse:');
        try {
          const schema = spec.components.schemas.DistrictExplainabilityResponse;
          const sample3 = ui.fn.jsonSchema202012.sampleFromSchema(schema, { includeReadOnly: true });
          console.log('Sample3 success! Size:', JSON.stringify(sample3).length);
        } catch (e) {
          console.error('CRASH in jsonSchema202012.sampleFromSchema:', e);
        }
      }
    }, 500);
  });
});
