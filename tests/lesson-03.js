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
  console.log('Lesson 03 — Express Error Handling Middleware\n');

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
      'src/middleware/error-handler.ts exists',
      fs.existsSync(errorMiddlewarePath),
      'Create src/middleware/error-handler.ts and define your errorHandler function there.',
    ),
  );

  results.push(
    check(
      'src/middleware/error-handler.ts defines an errorHandler function',
      errorMiddlewareSrc.includes('errorHandler'),
      'Define a function named errorHandler and export it from src/middleware/error-handler.ts.',
    ),
  );

  // Error handlers have 4 parameters — the 4-arg signature is what Express uses to
  // distinguish error-handling middleware from regular middleware.
  results.push(
    check(
      'errorHandler accepts 4 parameters (err, req, res, next)',
      /function errorHandler\s*\([^)]*err[^)]*,[^)]*req[^)]*,[^)]*res[^)]*,[^)]*_?next/.test(
        errorMiddlewareSrc,
      ) ||
        /errorHandler\s*=\s*\([^)]*err[^)]*,[^)]*req[^)]*,[^)]*res[^)]*,[^)]*_?next/.test(
          errorMiddlewareSrc,
        ),
      'Error handling middleware must have 4 parameters: (err, req, res, next). Express uses the number of parameters to identify error handlers — remove any one of them and errors will never reach it.',
    ),
  );

  results.push(
    check(
      'src/index.ts imports from middleware/error',
      indexSrc.includes('middleware/error'),
      'Import errorHandler from ./middleware/error.js in src/index.ts.',
    ),
  );

  results.push(
    check(
      'src/index.ts registers errorHandler with app.use()',
      indexSrc.includes('app.use(errorHandler)'),
      'Register the error handler in src/index.ts with app.use(errorHandler). It must come after app.use(router).',
    ),
  );

  // errorHandler must come after routes
  const routerIdx = indexSrc.indexOf('app.use(router)');
  const errorHandlerIdx = indexSrc.indexOf('app.use(errorHandler)');
  results.push(
    check(
      'errorHandler is registered after app.use(router)',
      routerIdx !== -1 && errorHandlerIdx !== -1 && errorHandlerIdx > routerIdx,
      'Move app.use(errorHandler) to after app.use(router) — the error handler must be the last middleware registered.',
    ),
  );

  build();

  const { server } = await startServer();

  try {
    const r1 = await makeRequest({ path: '/users/1', method: 'GET' });
    results.push(
      check(
        'GET /users/1 returns 200',
        r1.status === 200,
        'Make sure getUserById still returns a 200 response for a valid numeric ID.',
      ),
    );
    results.push(
      check(
        'GET /users/1 response has { success: true, data: { id: 1, ... }, error: null }',
        r1.json?.success === true &&
          r1.json?.data?.id === 1 &&
          r1.json?.error === null,
        'getUserById should respond with { success: true, data: <user>, error: null } for a found user.',
      ),
    );

    const r2 = await makeRequest({ path: '/users/abc', method: 'GET' });
    results.push(
      check(
        'GET /users/abc returns an error status (4xx or 5xx)',
        r2.status >= 400,
        'getUserById should throw an error when the id param is not a valid number. Make sure errorHandler is registered to catch it.',
      ),
    );
    results.push(
      check(
        'GET /users/abc response has { success: false, data: null, error: <string> }',
        r2.json?.success === false &&
          r2.json?.data === null &&
          typeof r2.json?.error === 'string',
        'errorHandler should respond with { success: false, data: null, error: <string> }.',
      ),
    );
  } finally {
    server.kill();
  }

  printResults(results, 'HANDLER');
}

main().catch((err) => {
  console.log('');
  console.log(`❌ Test runner error: ${err.message}`);
  console.log('');
  process.exit(1);
});
