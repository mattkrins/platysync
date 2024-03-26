import Handlebars from "handlebars";

/* eslint-disable @typescript-eslint/no-unused-vars */
Handlebars.registerHelper("$special", function() { return ""; });
Handlebars.registerHelper("$word", function() { return ""; });
Handlebars.registerHelper("$rand", function(_min=1, _max=9) { return ""; });
Handlebars.registerHelper("$upper", function(_str: string) { return "test"; });
Handlebars.registerHelper("$lower", function(_str: string) { return ""; });
Handlebars.registerHelper("$title", function(_str: string) { return ""; });
Handlebars.registerHelper("$cap", function(_str: string) { return ""; });
Handlebars.registerHelper("$clean", function(_str: string) { return ""; });
Handlebars.registerHelper("$find", function(_haystack: string, _needle: string) { return ""; });
Handlebars.registerHelper("$count", function(_str: string) { return ""; });
Handlebars.registerHelper("$grad", function(_str: string, _year = "12") { return ""; });
Handlebars.registerHelper("$inc", function(_str: string) { return ""; });
Handlebars.registerHelper("$escape", function(_str: string) { return ""; });
Handlebars.registerHelper("$ouFromDn", function(_str: string) { return ""; });
Handlebars.registerHelper("$dir", function() { return ""; });

export const compile = function(input: string, options?: CompileOptions | undefined) {
    return Handlebars.compile(input, {...options, noEscape: true, strict: true });
}