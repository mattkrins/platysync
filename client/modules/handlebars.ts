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
Handlebars.registerHelper("$dir", function() { return ""; });

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
    { key: "$inc", description: "Increments a numeric value by 1.", example: "{{$inc '2'}} > 3" },
    { key: "$rand", description: "Generates a random integer between the specified range.", example: "{{$rand 1 9}} > 5" },
    { key: "$special", description: "Generates a random special character from '!?$%&*)>'.", example: "{{$special}} > %" },
    { key: "$word", description: "Retrieves a random word from the dictionary.", example: "{{$word}} > bread" },
    { key: "$grad", description: "Converts a numeric value to a graduation year.", example: "{{$grad '7'}} > 2029 (if run in 2024)" },
];

export const paths = [
    { key: "$dir", description: "Prints the working directory of platysync.", example: "{{$dir}} > C:\\Users\\user\\AppData\\Roaming\\platysync" },
    //{ key: "$cache", description: "Prints a temporary / unique directory for this rule.", example: "{{$dir}} > C:\\Users\\user\\AppData\\Roaming\\platysync\\cache\\2b9b619b-380e-47f1-86de-89248a0a79bf" },
];

//TODO - add rule specific templates