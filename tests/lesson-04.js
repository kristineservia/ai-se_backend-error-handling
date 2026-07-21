import {
  check,
  makeRequest,
  build,
  startServer,
  printResults,
} from './utils.js';

async function main() {
  console.log('Lesson 04 — Attaching Status Codes to Errors\n');

  const results = [];

  build();

  const { server } = await startServer();

  try {
    const r1 = await makeRequest({ path: '/users/1', method: 'GET' });
    results.push(
      check(
        'GET /users/1 still returns 200',
        r1.status === 200,
        'Make sure getUserById still returns 200 for a valid user ID.',
      ),
    );

    const r2 = await makeRequest({ path: '/users/abc', method: 'GET' });
    results.push(
      check(
        'GET /users/abc returns 400',
        r2.status === 400,
        'Attach statusCode = 400 to the error before throwing when the ID is not a valid number.',
      ),
    );
    results.push(
      check(
        'GET /users/abc sends the specific error message (not the generic 500 string)',
        r2.json?.success === false &&
          r2.json?.data === null &&
          typeof r2.json?.error === 'string' &&
          !r2.json?.error.includes('error has occurred on the server'),
        'When statusCode is 400, errorHandler should send err.message — not the generic server error string.',
      ),
    );

    const r3 = await makeRequest({ path: '/users/99', method: 'GET' });
    results.push(
      check(
        'GET /users/99 returns 404',
        r3.status === 404,
        'Attach statusCode = 404 to the error before throwing when the user is not found.',
      ),
    );
    results.push(
      check(
        'GET /users/99 sends the specific error message',
        r3.json?.success === false &&
          r3.json?.data === null &&
          typeof r3.json?.error === 'string' &&
          !r3.json?.error.includes('error has occurred on the server'),
        'When statusCode is 404, errorHandler should send err.message.',
      ),
    );
  } finally {
    server.kill();
  }

  printResults(results, 'ATTACHED');
}

main().catch((err) => {
  console.log('');
  console.log(`❌ Test runner error: ${err.message}`);
  console.log('');
  process.exit(1);
});
