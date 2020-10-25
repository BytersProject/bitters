import { RequestOptions } from 'http';
import { URL } from 'url';
import { BittersRequest } from './lib/BittersRequest';
import { HttpMethods } from './lib/Enums';

export * from './lib/BittersRequest';
export * from './lib/BittersResponse';
export * from './lib/Enums';

export default (url: string | URL, method?: HttpMethods, coreOptions?: RequestOptions) => new BittersRequest(url, method, coreOptions);
