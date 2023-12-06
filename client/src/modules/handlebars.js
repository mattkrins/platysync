import Handlebars from 'handlebars/dist/handlebars.min.js' // https://github.com/handlebars-lang/handlebars.js/pull/1862
import dictionary from './dictionary.js'

function toTitleCase(str) { return str.replace(/\w\S*/g, function(txt){ return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); }); }
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const specials = "!?$%&*)>";
Handlebars.registerHelper("special", function() { return specials.split('')[(Math.floor(Math.random() * specials.length ))]; });

Handlebars.registerHelper("word", function() { return dictionary[Math.floor(Math.random() * dictionary.length)]; });
Handlebars.registerHelper("rand", function(min=1, max=9) { return clamp(Math.floor(Math.random() * 8) + 2, min, max); });
Handlebars.registerHelper("upper", function(str) { return str.toUpperCase(); });
Handlebars.registerHelper("lower", function(str) { return str.toLowerCase(); });
Handlebars.registerHelper("title", function(str) { return toTitleCase(str); });
Handlebars.registerHelper("cap", function(str) { return str.charAt(0).toUpperCase() + str.substr(1); });
Handlebars.registerHelper("grad", function(str) {
    const date = new Date();
    return (12 - Number(str || 7)) + date.getFullYear();
});
Handlebars.registerHelper('validStr', function(arg1, options) {
  return (arg1 && arg1.trim()!=="") ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('contains', function(arg1, arg2 , options) {
  return (arg1 && arg1.search(arg2)>=0 ) ? options.fn(this) : options.inverse(this);
});

export default Handlebars;

export function templateString(csv = {}, str="", row = 0){
    try {
        if (str==="") return str;
        if (!csv.data || csv.data.length <=0) return false;
        if (str===undefined) return false;
        const templated = Handlebars.compile(str, {noEscape:true});
        return templated(csv.data[row]);
    } catch (e) { return false; }
}