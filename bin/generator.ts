import { DMARCRecord, MTASTSRecord, AUTHTYPES } from "./declare";
import { dmarcValidators, tlsValidators } from "./validator";

function loopToValidate(record: string[], values: DMARCRecord | MTASTSRecord, validationType: AUTHTYPES) {
  let validators = validationType == 'dmarc' ? dmarcValidators: ( validationType == 'mtasts'? tlsValidators: null );
  validators.v.validate.call(validators.v, "v", values.v);
  record.push("v=" + values.v);
  for (var i = 0; i < Object.keys(values).length; i++) {
    var term = Object.keys(values)[i];
    if (term === "v") continue;
    if (validators[term]) {
      let settings = validators[term];
      var value = null;
      if (settings.generate) {
        value = settings.generate(values[term]);
      } else value = values[term];
      settings.validate.call(settings, term, value);
      record.push(term + "=" + value);
    }
  }
  return record;
}

/**
 * @param values 
 * @param type type should be from these values only ['mtasts', 'dmarc']
 * @returns 
 */
export const generator = async function (values: DMARCRecord | MTASTSRecord, type: AUTHTYPES) {
  var record = [];
  if (values.v == undefined) {
    throw new Error(`${type.toUpperCase()} Version is required tag`);
  }

  record = loopToValidate(record, values, type);
  return record.join("; ");
}

// export const dmarcGenerator = function (values: DMARCRecord): string {
//   var record = [];
//   if (values.v == undefined) {
//     throw new Error("DMARC Version is required tag");
//   }
  
//   record = loopToValidate(record, values, 'dmarc');
//   return record.join("; ");
// };

// export const mtaStsGenerator = function (values: MTASTSRecord): string {
//   var record = [];
//   if (values.v == undefined) {
//     throw new Error("STS Version is required tag");
//   }
  
//   record = loopToValidate(record, values, 'mtasts');
//   return record.join("; ");
// }