import Handlebars from "handlebars";

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
Handlebars.registerHelper("$date", function() { return ""; });
Handlebars.registerHelper("$formatDate", function(_str: string, _format = "LLL") { return ""; });
Handlebars.registerHelper("$split", function(_str: string, _part = "0", _separator = ",") { return ""; });
Handlebars.registerHelper("$uuidv4", function() { return ""; });

export const compile = function(input: string, options?: CompileOptions | undefined) {
    return Handlebars.compile(input, {...options, noEscape: true, strict: true });
}

export const genericHelpers = [
    { key: "$upper", description: "Converts the input to UPPERCASE.", example: "{{$upper 'HELLO world'}} > HELLO WORLD" },
    { key: "$lower", description: "Converts the input to lowercase.", example: "{{$lower 'HELLO world'}} > hello world" },
    { key: "$title", description: "Converts the input to Title Case.", example: "{{$title 'HELLO world'}} > Hello World" },
    { key: "$cap", description: "Capitalizes the first letter of the input.", example: "{{$cap 'hello world'}} > Hello world" },
    { key: "$escape", description: "Escapes special characters in the input string.", example: "{{$escape '& <'}} > &amp; &lt" },
    { key: "$clean", description: "Removes extra whitespace and newlines from the input.", example: "{{$clean 'hello \\n world \\n'}} > hello world" },
    { key: "$find", description: "Searches for the substring. Returns true or false.", example: "{{$find 'haystack' 'needle'}} > false" },
    { key: "$count", description: "Return length of given string.", example: "{{$count 'hello world'}} > 11" },
    { key: "$inc", description: "Increments a numeric value by 1.", example: "{{$inc '2'}} > 3" },
    { key: "$rand", description: "Generates a random integer between the specified range.", example: "{{$rand 1 9}} > 5" },
    { key: "$special", description: "Generates a random special character from '!?$%&*)>'.", example: "{{$special}} > %" },
    { key: "$word", description: "Retrieves a random word from the dictionary.", example: "{{$word}} > bread" },
    { key: "$grad", description: "Converts a numeric value to a graduation year.", example: "{{$grad '7'}} > 2029 (if run in 2024)" },
    { key: "$date", description: "Retrieves the current datetime.", example: "{{$date}} > Fri, 25 Jan 2024 02:00:00 GMT'" },
    { key: "$formatDate", description: "Format a date using day.js.", example: "{{$formatDate '2019-01-25', 'YY'}} > 25" },
    { key: "$split", description: "Return a substring given an index and/or separator.", example: "{{$split 'Hello world', '1', ' '}} > world" },
    { key: "$uuidv4", description: "Generates a version 4 UUID identifier.", example: "{{$uuidv4}} > c9916f3b-067b-4f1..." },
];

export const pathHelpers = [
    { key: "dir", description: "Prints the working directory of platysync.", example: "{{$path.dir}} > C:\\Users\\user\\AppData\\Roaming\\platysync" },
    { key: "cache", description: "Prints the cache directory of platysync.", example: "{{$path.cache}} > C:\\Users\\user\\AppData\\Roaming\\platysync\\cache" },
];

export const ruleHelpers = [
    { key: "name", description: "Prints the rule's name.", example: "{{$rule.name}} > My Rule" },
    { key: "id", description: "Prints the rule's unique run ID.", example: "{{$rule.id}} > c9916f3b-067b-4f1..." },
    { key: "schema", description: "Prints the current schema name.", example: "{{$rule.schema}} > My Schema" },
    { key: "scheduled", description: "Print if the rule was ran from a schedule.", example: "{{$rule.scheduled}} > false" },
];