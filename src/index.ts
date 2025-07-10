/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export default {
	async fetch(request, env: Env): Promise<Response> {
		const origin = request.headers.get('Origin');

		// Define allowed origins
		const allowedOrigins = [
			// Remove this after testing
			'http://localhost:3000',
			'http://172.16.2.11:3000',
			'https://netgeist.ai',
			'https://www.netgeist.ai',
			'https://nlp-website-git-dev-neurotechnology-nlps-projects.vercel.app',
		];

		// Check if origin is allowed
		const isAllowedOrigin = origin && allowedOrigins.some((allowed) => origin === allowed);

		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': '*',
				},
			});
		}

		if (request.method === 'GET') {
			if (!env.STT_URL || !env.STT_TOKEN) {
				return new Response('STT configuration is missing', {
					status: 500,
					headers: {
						'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
					},
				});
			}

			return new Response('Configuration is ok', {
				headers: {
					'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
				},
			});
		}

		if (request.method !== 'POST') {
			return new Response('Method not allowed', {
				status: 405,
				headers: {
					'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
				},
			});
		}

		// Reject requests from unauthorized origins
		if (!isAllowedOrigin) {
			return new Response('Unauthorized origin', {
				status: 403,
				headers: {
					'Access-Control-Allow-Origin': 'https://netgeist.ai',
				},
			});
		}

		const formData = await request.formData();

		let audioFile = formData.get('file') as Blob | string;

		if (!audioFile) {
			return Response.json(
				{ message: 'No audio file uploaded' },
				{
					status: 400,
					headers: {
						'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
					},
				}
			);
		}

		if (typeof audioFile === 'string') {
			// audioFile is a URL, fetch the audio from it
			try {
				const audioResponse = await fetch(audioFile);

				if (!audioResponse.ok) {
					return Response.json(
						{ message: 'Failed to fetch audio from URL' },
						{
							status: 400,
							headers: {
								'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
							},
						}
					);
				}

				const audioBlob = await audioResponse.blob();

				// Check file size (limit to 10MB)
				if (audioBlob.size > MAX_FILE_SIZE) {
					return Response.json(
						{ message: 'Audio file size exceeds 10MB limit' },
						{
							status: 400,
							headers: {
								'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
							},
						}
					);
				}

				// Use the fetched audio blob for processing
				audioFile = audioBlob;
			} catch (error) {
				return Response.json(
					{ message: 'Error fetching audio from URL' },
					{
						status: 400,
						headers: {
							'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
						},
					}
				);
			}
		}

		// Check file size (limit to 10MB)
		if (audioFile.size > MAX_FILE_SIZE) {
			return Response.json(
				{ message: 'File size exceeds 10MB limit' },
				{
					status: 400,
					headers: {
						'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
					},
				}
			);
		}

		const form = new FormData();
		form.append('file', audioFile, 'audio.wav');
		form.append('response_format', 'json');
		form.append('language', 'lithuanian');

		if (!env.STT_URL || !env.STT_TOKEN) {
			return Response.json(
				{ message: 'STT configuration is missing' },
				{
					status: 500,
					headers: {
						'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
					},
				}
			);
		}

		try {
			const response = await fetch(env.STT_URL, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${env.STT_TOKEN}`,
				},
				body: form,
			});

			if (!response.ok) {
				return Response.json(
					{ message: response.statusText },
					{
						status: response.status,
						headers: {
							'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
						},
					}
				);
			}

			const result = await response.json();
			return Response.json(result, {
				status: 200,
				headers: {
					'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
				},
			});
		} catch {
			return Response.json(
				{ message: 'Error processing audio file' },
				{
					status: 500,
					headers: {
						'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'https://netgeist.ai',
					},
				}
			);
		}
	},
} satisfies ExportedHandler<Env>;
