import { RequestOptions, IncomingMessage } from 'http';

export class CentraResponse {

	public coreRes: IncomingMessage;
	public resOptions: RequestOptions;
	public body: Buffer;
	public headers: IncomingMessage['headers'];
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
		return this.statusCode === 204 ? null : JSON.parse(this.body.toString());
	}

	public get text(): string {
		return this.body.toString();
	}

	public static parse: (text: string, ...args: any[]) => any = JSON.parse;

}

