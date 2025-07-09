import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('STT Demo Proxy worker', () => {
	it('responds with configuration status on GET request', async () => {
		const request = new IncomingRequest('http://example.com', { method: 'GET' });
		const response = await worker.fetch(request, env);

		// Should return 500 if STT configuration is missing (which it will be in test env)
		expect(response.status).toBe(500);
		expect(await response.text()).toBe('STT configuration is missing');
	});

	it('handles CORS preflight requests', async () => {
		const request = new IncomingRequest('http://example.com', {
			method: 'OPTIONS',
			headers: {
				Origin: 'https://netgeist.ai',
			},
		});
		const response = await worker.fetch(request, env);

		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://netgeist.ai');
		expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
	});

	it('rejects unauthorized origins', async () => {
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			headers: {
				Origin: 'https://unauthorized-site.com',
			},
		});
		const response = await worker.fetch(request, env);

		expect(response.status).toBe(403);
		expect(await response.text()).toBe('Unauthorized origin');
	});

	it('rejects requests without audio file', async () => {
		const formData = new FormData();
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			headers: {
				Origin: 'https://netgeist.ai',
			},
			body: formData,
		});
		const response = await worker.fetch(request, env);

		expect(response.status).toBe(400);
		const result = (await response.json()) as { message: string };
		expect(result.message).toBe('No audio file uploaded');
	});

	it('rejects unsupported HTTP methods', async () => {
		const request = new IncomingRequest('http://example.com', { method: 'PUT' });
		const response = await worker.fetch(request, env);

		expect(response.status).toBe(405);
		expect(await response.text()).toBe('Method not allowed');
	});
});
