import { ClientRequest, IncomingMessage, request as httpRequest, RequestOptions } from 'http';
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
	public data: string | Buffer | null;
	public sendDataAs: DataForm | null;
	public reqHeaders: Record<string, string>;
	public streamEnabled: boolean;
	public compressionEnabled: boolean;
	public coreOptions: RequestOptions;

	public constructor(url: string, method: HttpMethods | undefined = HttpMethods.GET) {
		this.url = typeof url === 'string' ? new URL(url) : url;
		this.httpMethod = method;
		this.data = null;
		this.sendDataAs = null;
		this.reqHeaders = {};
		this.streamEnabled = false;
		this.compressionEnabled = false;
		this.coreOptions = {};
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

	public header(a1: string | Record<string, string>, a2?: string) {
		if (typeof a1 === 'object') {
			Object.keys(a1).forEach(headerName => {
				this.reqHeaders[headerName.toLowerCase()] = a1[headerName];
			});
		} else {
			this.reqHeaders[a1.toLowerCase()] = a2!;
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

	public async json() {
		const res = await this.send() as CentraResponse;
		return res.json;
	}

	public async raw() {
		const res = await this.send() as CentraResponse;
		return res.body;
	}

	public async text() {
		const res = await this.send() as CentraResponse;
		return res.text;
	}

	public send() {
		return new Promise((resolve, reject) => {
			if (this.data) {
				if (!this.reqHeaders.hasOwnProperty('content-type')) {
					if (this.sendDataAs === 'json') this.reqHeaders['content-type'] = 'application/json';

					else if (this.sendDataAs === 'form') this.reqHeaders['content-type'] = 'application/x-www-form-urlencoded';
				}

				if (!this.reqHeaders.hasOwnProperty('content-length')) this.reqHeaders['content-length'] = Buffer.byteLength(this.data).toString();
			}

			const options = {
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

				let centraRes: CentraResponse | undefined = undefined;

				if (this.streamEnabled) {
					resolve(stream);
				} else {
					centraRes = new CentraResponse(res as IncomingMessage, this.coreOptions);

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

			if (this.url.protocol === 'http:') req = httpRequest(options, resHandler);
			else if (this.url.protocol === 'https:') req = httpsRequest(options, resHandler);
			else throw new Error(`Bad URL protocol: ${this.url.protocol}`);

			req.on('error', err => {
				reject(err);
			});

			if (this.data) req.write(this.data);

			req.end();
		});
	}

}
