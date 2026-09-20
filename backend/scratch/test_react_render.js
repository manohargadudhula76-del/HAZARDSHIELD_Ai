const fs = require('fs');
const http = require('http');

global.window = global;
global.Node = class Node {};
global.Element = class Element {};
global.HTMLElement = class HTMLElement extends global.Element {};
global.HTMLIFrameElement = class HTMLIFrameElement extends global.HTMLElement {};
global.window.location = {
  origin: 'http://127.0.0.1:8000',
  href: 'http://127.0.0.1:8000/docs',
  pathname: '/docs',
  protocol: 'http:',
  host: '127.0.0.1:8000',
  hash: '',
  search: ''
};
global.location = global.window.location;

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
      // Find React in bundle or system
      const system = ui;
      const ResponsesComp = system.getComponent('responses');
      console.log('Responses component found:', !!ResponsesComp);

      const opPaths = [
        ['/api/v1/decision-support', 'get'],
        ['/api/v1/explainability', 'get'],
        ['/api/v1/explainability/priorities', 'get'],
        ['/api/v1/explainability/{district_id}', 'get']
      ];

      for (const [p, m] of opPaths) {
        console.log(`\n--- Testing Responses component for ${m.toUpperCase()} ${p} ---`);
        try {
          const op = system.specSelectors.operationWithMeta(p, m);
          if (!op) {
            console.log('Operation not found in specSelectors:', p);
            continue;
          }
          const responses = op.get('responses');
          console.log('Responses keys:', responses ? responses.keySeq().toArray() : 'null');

          // Try instantiating and rendering responses component
          const props = {
            responses: responses,
            path: p,
            method: m,
            specPath: ['paths', p, m, 'responses'],
            getComponent: system.getComponent,
            getConfigs: system.getConfigs,
            specSelectors: system.specSelectors,
            specActions: system.specActions,
            oas3Selectors: system.oas3Selectors,
            oas3Actions: system.oas3Actions,
            fn: system.fn,
          };

          const instance = new ResponsesComp(props);
          const rendered = instance.render();
          console.log('Rendered successfully! Element type:', rendered ? rendered.type : null);

          // Now test individual Response component for each response code
          const ResponseComp = system.getComponent('response');
          for (const [code, resp] of responses.entrySeq()) {
            console.log(`  Testing Response component for code ${code}...`);
            const respProps = {
              key: code,
              path: p,
              method: m,
              code: code,
              response: resp,
              specPath: ['paths', p, m, 'responses', code],
              getComponent: system.getComponent,
              getConfigs: system.getConfigs,
              specSelectors: system.specSelectors,
              specActions: system.specActions,
              oas3Selectors: system.oas3Selectors,
              oas3Actions: system.oas3Actions,
              fn: system.fn,
              contentType: 'application/json',
            };
            const respInstance = new ResponseComp(respProps);
            const respRendered = respInstance.render();
            console.log(`  Response ${code} rendered successfully!`);
          }
        } catch (e) {
          console.error(`ERROR for ${p}:`, e.message);
          console.error(e.stack);
        }
      }
    }, 1000);
  });
});
