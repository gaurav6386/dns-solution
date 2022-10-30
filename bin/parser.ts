import { promises } from "dns";
import { AUTHTYPES } from "./declare";
const dns = new promises.Resolver();

type ReturnVal = {
  tags: any;
  messages: string[];
};
import { tlsValidators, tlsPolicyValidators, dmarcValidators } from "./validator";

export const parser = async (policy: string, recordType: AUTHTYPES): Promise<ReturnVal> => {
  const terms = policy
    .split(/;/)
    .map((t) => t.trim()) // Trim surrounding whitespace
    .filter((x) => x !== ""); // Ignore empty tags

  let rules = terms.map((x) => x.split(/[=]/).map((p) => p.trim()));

  let retval: ReturnVal = {
    tags: {},
    messages: [],
  };

  // Make sure `v` is the first tag
  if (!/^v$/i.test(rules[0][0])) {
    retval.messages.push(`First tag in a ${recordType} policy must be 'v', but found: '${rules[0][0]}'`);
    return retval;
  }

  for (let rule of rules) {
    let term = rule[0];
    let value = rule[1];

    let found = false;

    const validators = recordType.toLowerCase() == 'dmarc' ? dmarcValidators : recordType.toLowerCase() == 'mtasts'? tlsValidators: '';
    
    if(!validators) return retval;
    
    for (let validatorTerm of Object.keys(validators)) {
      let settings = validators[validatorTerm];

      // Term matches validator
      debugger;
      let termRegex = new RegExp(`^${validatorTerm}$`, "i");
      if (termRegex.test(term)) {
        found = true;

        let tag: { value?: string; description: string } = {
          // tag: term,
          description: settings.description,
        };

        if (settings.validate) {
          try {
            settings.validate.call(settings, term, value);
            tag.value = value;
            retval.tags[term] = tag;
          } catch (err) {
            retval.messages.push(err.message);
          }
        }
        break;
      }
    }

    if (!found) {
      retval.messages.push(`Unknown tag '${term}'`);
    }
  }

  // Remove "messages"
  if (retval.messages.length === 0) {
    delete retval.messages;
  }

  return retval;
};
