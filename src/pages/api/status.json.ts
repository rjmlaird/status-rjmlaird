import type { APIRoute } from 'astro';
import { checkAllServices, overallState } from '../../lib/services';

export const prerender = false;

export const GET: APIRoute = async () => {
  const results = await checkAllServices();
  const body = {
    state: overallState(results),
    checkedAt: new Date().toISOString(),
    services: results,
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
};
