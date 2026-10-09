import { createServer } from 'vite';

process.env.NODE_ENV = 'test';

async function runTests() {
  console.log('--- STARTING SMART CAMPUS FULL INTEGRATION & SERVER TEST SUITE ---');
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
    ssr: {
      external: ['mqtt', 'aedes', 'pg', 'pg-mem', 'ws'],
    },
  });

  try {
    console.log('\n[Suite 1/4] Client Services & Realtime Architecture Tests...');
    await server.ssrLoadModule('./src/services/__tests__/integration.test.ts');

    console.log('\n[Suite 2/4] Production Server, REST API, WebSocket & MQTT Contract Tests...');
    await server.ssrLoadModule('./server/__tests__/server.test.ts');

    console.log('\n[Suite 3/4] End-to-End Infrastructure Commissioning Suite...');
    await server.ssrLoadModule('./server/__tests__/commissioning.test.ts');

    console.log('\n[Suite 4/5] Security Remediation Phase 1 Direct Exploit Regression Suite...');
    await server.ssrLoadModule('./server/__tests__/security_remediation_phase1.test.ts');

    console.log('\n[Suite 5/6] Security Remediation Phase 2 Direct Exploit Regression Suite...');
    await server.ssrLoadModule('./server/__tests__/security_remediation_phase2.test.ts');

    console.log('\n[Suite 6/7] Smart Campus Identity, Role Authorization & Anti-Escalation Suite...');
    await server.ssrLoadModule('./server/__tests__/identity_role_security.test.ts');

    console.log('\n[Suite 7/7] Smart Campus Security & Functionality Remediation Full Suite...');
    await server.ssrLoadModule('./server/__tests__/security_remediation_full.test.ts');

    console.log('\n--- ALL TEST SUITES COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    await server.close();
  }
}

runTests();
