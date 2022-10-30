import { promises } from "dns";
import { AUTHTYPES } from "./declare";
import { normalize } from "./error";
// const dns = require('dns');
const dns = new promises.Resolver();

function mtaStsFetcher(domainName: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const policyValidation: string[][] | Error = await dns.resolveTxt(`_mta-sts.${domainName}`).catch(normalize);
    const tlsReportValidation: string[][] | Error = await dns.resolveTxt(`_smtp._tls.${domainName}`).catch(normalize);
    if (policyValidation instanceof Error && policyValidation.message?.startsWith("queryTxt ENOTFOUND")) return reject("Policy file is not correctly setup.");
    if (tlsReportValidation instanceof Error && tlsReportValidation.message?.startsWith("queryTxt ENOTFOUND")) return reject("MTA-STS Record not available.");
    
    if (policyValidation instanceof Error) return reject(policyValidation);
    if (tlsReportValidation instanceof Error) return reject(tlsReportValidation);
  
    let record = null;
    for (let i = 0; i < tlsReportValidation.length; i++) {
      if (!tlsReportValidation[i]?.join("")?.startsWith("v=TLSRPTv1")) continue;
      record = tlsReportValidation[i].join("");
      break;
    }
  
    if (!record) throw new Error("MTA-STS Record not available");
    return record;
  })
}

function dmarcFetcher(domainName: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const resp: string[][] | Error = await dns.resolveTxt(`_dmarc.${domainName}`).catch(normalize);
    if (resp instanceof Error && resp.message?.startsWith("queryTxt ENOTFOUND")) throw new Error("DMARC Record not available");
    if (resp instanceof Error) throw resp;
  
    let record: string = '';
    for (let i = 0; i < resp.length; i++) {
      if (!resp[i]?.join("")?.startsWith("v=DMARC")) continue;
      record = resp[i].join("");
      break;
    }
  
    if (!record) throw new Error("DMARC Record not available");
    resolve(record);
  })
}

export const fetcher = async (domainName: string, recordType: AUTHTYPES) => {
  switch(recordType){
    case "dmarc": {
      const record = await dmarcFetcher(domainName);
      return record;
    }
    case "mtasts": {
      const record = await mtaStsFetcher(domainName);
      return record;
    }
    default: {
      throw new Error("No Record available for given auth type");
    }
  }
};
