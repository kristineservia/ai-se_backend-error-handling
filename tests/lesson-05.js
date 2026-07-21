import fs from 'fs';
import path from 'path';
import {
  check,
  makeRequest,
  build,
  startServer,
  printResults,
  PROJECT_ROOT,
} from './utils.js';

async function main() {
  console.log('Lesson 05 — Handling 404s and Unknown Routes\n');

  const results = [];

  const errorMiddlewarePath = path.join(
    PROJECT_ROOT,
    'src/middleware/error-handler.ts',
  );
  const errorMiddlewareSrc = fs.existsSync(errorMiddlewarePath)
    ? fs.readFileSync(errorMiddlewarePath, 'utf8')
    : '';
  const indexSrc = fs.existsSync(path.join(PROJECT_ROOT, 'src/index.ts'))
    ? fs.readFileSync(path.join(PROJECT_ROOT, 'src/index.ts'), 'utf8')
    : '';

  results.push(
    check(
      'src/middleware/error-handler.ts defines a notFoundHandler function',
      errorMiddlewareSrc.includes('notFoundHandler'),
      'Add a notFoundHandler function to src/middleware/error-handler.ts and export it.',
    ),
  );

  results.push(
    check(
      'src/index.ts registers notFoundHandler with app.use()',
      indexSrc.includes('app.use(notFoundHandler)'),
      'Import notFoundHandler from ./middleware/error.js and register it with app.use(notFoundHandler).',
    ),
  );

  // notFoundHandler must be registered before errorHandler (it catches unmatched routes,
  // not thrown errors — so it needs to sit between routes and the error handler)
  const notFoundIdx = indexSrc.indexOf('app.use(notFoundHandler)');
  const errorHandlerIdx = indexSrc.indexOf('app.use(errorHandler)');
  results.push(
    check(
      'notFoundHandler is registered before errorHandler',
      notFoundIdx !== -1 &&
        errorHandlerIdx !== -1 &&
        notFoundIdx < errorHandlerIdx,
      'Register notFoundHandler before errorHandler in src/index.ts. It catches unmatched routes; errorHandler catches thrown errors.',
    ),
  );

  build();

  const { server } = await startServer();

  try {
    const r1 = await makeRequest({ path: '/unicorns', method: 'GET' });
    results.push(
      check(
        'GET /unicorns returns 404',
        r1.status === 404,
        'notFoundHandler should respond with status 404 for any route that does not exist.',
      ),
    );
    results.push(
      check(
        'GET /unicorns response has { success: false, data: null, error: <string> }',
        r1.json?.success === false &&
          r1.json?.data === null &&
          typeof r1.json?.error === 'string',
        'notFoundHandler should respond with { success: false, data: null, error: <string> }.',
      ),
    );

    const r2 = await makeRequest({ path: '/users', method: 'GET' });
    results.push(
      check(
        'GET /users still returns 200',
        r2.status === 200,
        'Make sure adding the not-found handler did not break the existing /users route.',
      ),
    );

    const r3 = await makeRequest({ path: '/users/1', method: 'GET' });
    results.push(
      check(
        'GET /users/1 still returns 200',
        r3.status === 200,
        'Make sure GET /users/:id still works after adding the not-found handler.',
      ),
    );

    const r4 = await makeRequest({ path: '/users/abc', method: 'GET' });
    results.push(
      check(
        'GET /users/abc still returns an error status (errorHandler still works)',
        r4.status >= 400,
        'The errorHandler should still be catching errors thrown by route handlers.',
      ),
    );
  } finally {
    server.kill();
  }

  printResults(results, 'NOTFOUND');
}

main().catch((err) => {
  console.log('');
  console.log(`❌ Test runner error: ${err.message}`);
  console.log('');
  process.exit(1);
});
