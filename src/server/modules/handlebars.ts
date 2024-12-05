import Handlebars from "handlebars";
import dayjs from "dayjs";
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import { v4 as uuidv4 } from 'uuid';
import dictionary from './dictionary.js'
import ldap from "./ldap.js";
dayjs.extend(localizedFormat);

function toTitleCase(str: string) { return str.replace(/\w\S*/g, function(txt){ return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); }); }
const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

const specials = "!?$%&*)>";
Handlebars.registerHelper("$special", function() { return specials.split('')[(Math.floor(Math.random() * specials.length ))]; });
Handlebars.registerHelper("$word", function() { return dictionary[Math.floor(Math.random() * dictionary.length)]; });
Handlebars.registerHelper("$rand", function(min=1, max=9) { return clamp(Math.floor(Math.random() * 8) + 2, min, max); });
Handlebars.registerHelper("$upper", function(str: string) { return str.toUpperCase(); });
Handlebars.registerHelper("$lower", function(str: string) { return str.toLowerCase(); });
Handlebars.registerHelper("$title", function(str: string) { return toTitleCase(str); });
Handlebars.registerHelper("$cap", function(str: string) { return str.charAt(0).toUpperCase() + str.substr(1); });
Handlebars.registerHelper("$clean", function(str: string) { return str.replace(/\n/, "").replace(/\r/, "").trim(); });
Handlebars.registerHelper("$find", function(haystack: string, needle: string) { return haystack.includes(needle) });
Handlebars.registerHelper("$count", function(str: string) { return String(str.length); });
Handlebars.registerHelper("$inc", function(str: string) { return String(parseInt(str) + 1); });
Handlebars.registerHelper("$escape", function(str: string) { return Handlebars.escapeExpression(str); });
Handlebars.registerHelper("$ouFromDn", function(str: string) { return ldap.ouFromDn(str); });
Handlebars.registerHelper("$grad", function(str: string, year?: string) {
    if (!year || typeof year !== "string") year = "12";
    return (parseInt(year) - Number(str)) + (new Date()).getFullYear();
});
Handlebars.registerHelper("$date", function() { return dayjs().toString(); });
Handlebars.registerHelper("$formatDate", function(str: string, format?: string) {
    if (!format || typeof format !== "string") format = "LLL";
    return dayjs(str).format(format);
});
Handlebars.registerHelper("$split", function(str: string, part?: string, separator?: string) {
    if (!part || typeof part !== "string") part = "0";
    if (!separator || typeof separator !== "string") separator = ",";
    return str.split(separator)[parseInt(part)];
});

Handlebars.registerHelper("$uuidv4", function() { return uuidv4(); });

const compiler = Handlebars.compile;
Handlebars.compile = function(input: string, options?: CompileOptions | undefined) {
    return compiler(input, {...options, noEscape: true});
}

/**
 * Handlebars compile
 * @param {object} template Template object
 * @param {string} input String to parse with template
 * @param {string} input Default if input was empty
**/
export function compile(template={}, input='', def?: string) {
    if (!input) return def||'';
    return Handlebars.compile(input)(template);
}

export default Handlebars;