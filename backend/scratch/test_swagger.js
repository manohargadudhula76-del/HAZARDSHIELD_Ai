const fs = require('fs');
const http = require('http');

// Simple DOM mock
global.window = {
  location: { origin: 'http://127.0.0.1:8000' },
  addEventListener: () => {},
  removeEventListener: () => {},
};
global.document = {
  getElementById: () => ({ appendChild: () => {} }),
  createElement: () => ({
    setAttribute: () => {},
    appendChild: () => {},
    style: {},
  }),
  getElementsByTagName: () => [],
};
global.navigator = { userAgent: 'node' };

try {
  const bundleCode = fs.readFileSync('swagger-ui-bundle.js', 'utf8');
  eval(bundleCode);
  console.log('SwaggerUIBundle defined?', typeof SwaggerUIBundle);

  // Fetch openapi.json
  http.get('http://127.0.0.1:8000/api/v1/openapi.json', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      const spec = JSON.parse(raw);
      console.log('Spec loaded. Initializing SwaggerUIBundle...');
      const ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset,
        ],
      });
      console.log('SwaggerUIBundle initialized successfully.');

      // Wait a moment for async resolving
      setTimeout(() => {
        const state = ui.getState();
        console.log('State keys:', Object.keys(state.toJS ? state.toJS() : state));
        const specState = ui.specSelectors.specStr();
        console.log('Spec resolved successfully.');
      }, 1000);
    });
  }).on('error', (err) => {
    console.error('HTTP error:', err.message);
  });
} catch (e) {
  console.error('Error running swagger-ui:', e);
}
