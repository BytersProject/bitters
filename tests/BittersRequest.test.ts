/* eslint-disable @typescript-eslint/naming-convention */
import { BittersRequest } from '../src';
import { URL as NURL } from 'url';

describe('BittersRequest', () => {
	describe('JSON', () => {
		test('GET JSON data FROM https://jsonplaceholder.typicode.com/posts/1 STRING', async () => {
			expect.assertions(1);

			const URL = 'https://jsonplaceholder.typicode.com/posts/1';
			const RESPONSE = {
				userId: 1,
				id: 1,
				title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
				body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto'
			};

			const request = new BittersRequest(URL);
			const response = await request.json();

			expect(response).toEqual(RESPONSE);
		});

		test('GET JSON data FROM https://jsonplaceholder.typicode.com/posts/1 URL', async () => {
			expect.assertions(1);

			const URL = new NURL('https://jsonplaceholder.typicode.com/posts/1');
			const RESPONSE = {
				userId: 1,
				id: 1,
				title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
				body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto'
			};

			const request = new BittersRequest(URL);
			const response = await request.json();

			expect(response).toEqual(RESPONSE);
		});
	});

	describe('Query Params', () => {
		const QS = [
			['test', 'test1'],
			['test1', 'test']
		];
		const OQS = Object.fromEntries(QS);

		test('CHECK THAT passed query params MATCH RECIEVED query params object', async () => {
			expect.assertions(1);

			const URL = 'https://postman-echo.com/get';

			const request = new BittersRequest(URL);
			const response = await request
				.query('test', 'test1')
				.query('test1', 'test')
				.json() as { args: Record<string, string> };

			expect(response.args).toEqual(OQS);
		});

		test('CHECK THAT passed query params OBJECT MATCH RECIEVED query params object', async () => {
			expect.assertions(1);

			const URL = 'https://postman-echo.com/get';

			const request = new BittersRequest(URL);
			const response = await request
				.query(OQS)
				.json() as { args: Record<string, string> };

			expect(response.args).toEqual(OQS);
		});

		test('CHECK THAT passed query params TUPLE ARRAY MATCH RECIEVED query params object', async () => {
			expect.assertions(1);

			const URL = 'https://postman-echo.com/get';

			const request = new BittersRequest(URL);
			const response = await request
				.query(QS)
				.json() as { args: Record<string, string> };

			expect(response.args).toEqual(OQS);
		});
	});
});
