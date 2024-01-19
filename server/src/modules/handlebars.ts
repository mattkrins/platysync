import Handlebars from "handlebars";
import dictionary from './dictionary.js'

function toTitleCase(str: string) { return str.replace(/\w\S*/g, function(txt){ return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); }); }
const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

const specials = "!?$%&*)>";
Handlebars.registerHelper("special", function() { return specials.split('')[(Math.floor(Math.random() * specials.length ))]; });
Handlebars.registerHelper("word", function() { return dictionary[Math.floor(Math.random() * dictionary.length)]; });
Handlebars.registerHelper("rand", function(min=1, max=9) { return clamp(Math.floor(Math.random() * 8) + 2, min, max); });
Handlebars.registerHelper("upper", function(str: string) { return str.toUpperCase(); });
Handlebars.registerHelper("lower", function(str: string) { return str.toLowerCase(); });
Handlebars.registerHelper("title", function(str: string) { return toTitleCase(str); });
Handlebars.registerHelper("cap", function(str: string) { return str.charAt(0).toUpperCase() + str.substr(1); });
Handlebars.registerHelper("clean", function(str: string) { return str.replace(/\n/, "").trim(); });
Handlebars.registerHelper("find", function(haystack: string, needle: string) { return haystack.includes(needle) });
Handlebars.registerHelper("grad", function(str: string) {
    const date = new Date();
    return (12 - Number(str || 7)) + date.getFullYear();
});
Handlebars.registerHelper("inc", function(str: string) { return parseInt(str) + 1; });

export default Handlebars;