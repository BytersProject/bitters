import { IncomingHttpHeaders, IncomingMessage, RequestOptions } from 'http';

export class BittersResponse {

	public coreRes: IncomingMessage;
	public resOptions: RequestOptions;
	public body: Buffer;
	public headers: IncomingHttpHeaders;
	public statusCode: IncomingMessage['statusCode'];

	public constructor(res: IncomingMessage, resOptions: RequestOptions) {
		this.coreRes = res;
		this.resOptions = resOptions;

		this.body = Buffer.alloc(0);

		this.headers = res.headers;
		this.statusCode = res.statusCode;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	public _addChunk(chunk: Buffer): void {
		this.body = Buffer.concat([this.body, chunk]);
	}

	public get json(): unknown {
		return this.statusCode === 204 ? null : BittersResponse.parse(this.body.toString());
	}

	public get text(): string {
		return this.body.toString();
	}

	public static parse: (text: string, ...args: any[]) => any = JSON.parse;

}

