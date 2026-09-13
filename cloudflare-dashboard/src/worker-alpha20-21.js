import baseWorker from './worker.js';
import { handlePersistenceLoad, handlePersistenceUpsert, handleTeacher2021, rollingTeacherUsage } from './alpha20-21-control-plane.js';

function json(data, response) {
  const headers = new Headers(response && response.headers || {});
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(data), { status: response ? response.status : 200, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/api/v3/persistence/load') return handlePersistenceLoad(request, env);
    if (request.method === 'POST' && url.pathname === '/api/v3/persistence/upsert') return handlePersistenceUpsert(request, env);
    if (request.method === 'POST' && url.pathname === '/api/v3/brain/teacher') return handleTeacher2021(request, env);

    const response = await baseWorker.fetch(request, env, ctx);
    if (response.ok && request.method === 'GET' && (url.pathname === '/api/v3/overview' || url.pathname === '/api/v3/brain')) {
      try {
        const data = await response.clone().json();
        const usage = await rollingTeacherUsage(env);
        if (url.pathname === '/api/v3/overview') data.brainUsage = { ...usage, day: 'rolling-24h', updatedAt: Date.now() };
        else data.usage = { ...usage, day: 'rolling-24h', updatedAt: Date.now() };
        return json(data, response);
      } catch (_) { return response; }
    }
    if (response.ok && request.method === 'GET' && url.pathname === '/api/health') {
      try {
        const data = await response.clone().json();
        data.alpha20_21 = { cloudLongTermPersistence: true, teacherBudget: 'rolling-24h-8500-usable-10000-hard', teacherReserve: 1500 };
        return json(data, response);
      } catch (_) { return response; }
    }
    return response;
  }
};
