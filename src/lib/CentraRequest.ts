import { ClientRequest, IncomingMessage, OutgoingHttpHeaders, request as httpRequest, RequestOptions } from 'http';
import { request as httpsRequest } from 'https';
import path from 'path';
import qs from 'querystring';
import * as stream from 'stream';
import { URL } from 'url';
import zlib from 'zlib';
import { CentraResponse } from './CentraResponse';
import { DataForm, HttpMethods } from './Enums';

export class CentraRequest {

	public url: URL;
	public httpMethod: HttpMethods;
	public data: string | Buffer | null = null;
	public sendDataAs: DataForm | null = null;
	public reqHeaders: OutgoingHttpHeaders = {};
	public streamEnabled = false;
	public compressionEnabled = false;
	public coreOptions: RequestOptions = {};

	protected response?: CentraResponse;

	public constructor(url: string | URL, method?: HttpMethods, coreOptions?: RequestOptions) {
		this.url = typeof url === 'string' ? new URL(url) : url;
		this.httpMethod = method ?? HttpMethods.GET;
		this.coreOptions = coreOptions ?? this.coreOptions;
	}

	public query(name: string | Record<string, string> | Array<string[]>, value?: string) {
		if (Array.isArray(name)) {
			for (const [k, v] of name) {
				this.url.searchParams.set(k, v);
			}
		} else if (name && name.constructor === Object) {
			for (const [k, v] of Object.entries(name)) {
				this.url.searchParams.set(k, v);
			}
		} else {
			this.url.searchParams.set(name as string, value!);
		}
		return this;
	}

	public path(relativePath: string) {
		this.url.pathname = path.join(this.url.pathname, relativePath);
		return this;
	}

	public body(data: any, sendAs?: DataForm) {
		this.sendDataAs
			= (typeof data === 'object' && !sendAs && !Buffer.isBuffer(data)
				? DataForm.JSON
				: sendAs
					? sendAs.toLowerCase()
					: DataForm.Buffer) as DataForm;

		this.data
			= this.sendDataAs === DataForm.Form
				? qs.stringify(data)
				: this.sendDataAs === DataForm.JSON
					? JSON.stringify(data)
					: data;

		return this;
	}

	public header(name: string | Record<string, string> | Array<string[]>, value?: string) {
		if (Array.isArray(name)) {
			for (const [k, v] of name) {
				this.reqHeaders[k.toLowerCase()] = v;
			}
		} else if (name && name.constructor === Object) {
			for (const [k, v] of Object.entries(name)) {
				this.reqHeaders[k.toLowerCase()] = v;
			}
		} else {
			this.reqHeaders[(name as string).toLowerCase()] = value;
		}
		return this;
	}

	public method(method: HttpMethods) {
		this.httpMethod = method;
		return this;
	}

	public timeout(timeout: number) {
		this.coreOptions.timeout = timeout;
		return this;
	}

	public async res() {
		if (this.response === undefined) this.response = await this.send() as CentraResponse;
		return this.response;
	}

	public async json() {
		if (this.response === undefined) this.response = await this.send() as CentraResponse;
		return this.response.json;
	}

	public async raw() {
		if (this.response === undefined) this.response = await this.send() as CentraResponse;
		return this.response.json;
	}

	public async text() {
		if (this.response === undefined) this.response = await this.send() as CentraResponse;
		return this.response.json;
	}

	public send() {
		return new Promise((resolve, reject) => {
			if (this.data) {
				if (!Reflect.has(this.reqHeaders, 'content-type')) {
					if (this.sendDataAs === 'json') this.reqHeaders['content-type'] = 'application/json';
					else if (this.sendDataAs === 'form') this.reqHeaders['content-type'] = 'application/x-www-form-urlencoded';
				}

				if (!Reflect.has(this.reqHeaders, 'content-length')) this.reqHeaders['content-length'] = Buffer.byteLength(this.data).toString();
			}

			const options: RequestOptions = {
				protocol: this.url.protocol,
				host: this.url.hostname,
				port: this.url.port,
				path: this.url.pathname + this.url.search,
				method: this.httpMethod,
				headers: this.reqHeaders,
				...this.coreOptions
			};

			let req: ClientRequest | undefined = undefined;

			const resHandler = (res: stream.Readable) => {
				let stream = res;

				if (this.compressionEnabled) {
					if ((res as IncomingMessage).headers['content-encoding'] === 'gzip') stream = res.pipe(zlib.createGunzip());
					else if ((res as IncomingMessage).headers['content-encoding'] === 'deflate') stream = res.pipe(zlib.createInflate());
				}

				if (this.streamEnabled) {
					resolve(stream);
				} else {
					const centraRes = new CentraResponse(res as IncomingMessage, options);

					stream.on('error', err => {
						reject(err);
					});

					stream.on('data', chunk => {
						centraRes!._addChunk(chunk);
					});

					stream.on('end', () => {
						resolve(centraRes);
					});
				}
			};

			if (this.url.protocol === 'http:') {
				req = httpRequest(options, resHandler);
			} else if (this.url.protocol === 'https:') {
				req = httpsRequest(options, resHandler);
			} else {
				throw new Error(`Bad URL protocol: ${this.url.protocol}`);
			}

			req.on('error', err => {
				reject(err);
			});

			if (this.data) req.write(this.data);

			req.end();
		});
	}

}
