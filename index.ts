import { FetchOptions, FetchResponse, AUTHTYPES } from "./bin/declare";
import { fetcher } from "./bin/fetcher";
import { generator } from "./bin/generator";
import { parser } from "./bin/parser";

export const parse = async function (record: string, recordType: AUTHTYPES) {
  var result = await parser(record, recordType);
  if (result.messages && result.messages.length) throw new Error(result.messages.join("."));
  return result.tags;
};

export const fetch = async function (domainName: string, recordType: AUTHTYPES, options?: FetchOptions): Promise<FetchResponse> {
  const shouldDescribe = options?.describe ?? true;
  let record = await fetcher(domainName, recordType);

  const resp: FetchResponse = { record };
  if (shouldDescribe) {
    let tags = await parse(record, recordType);
    resp.tags = tags;
  }

  return resp;
};

export const generate = generator;
