var login = require("facebook-chat-api");
var toHex = require('colornames')
var request = require('request');
var config = require("./config");

// Log in
login({email: config.username, password: config.password}, function callback (err, api) {
    if(err) return console.error(err);

    // Making sure we are listening to our own messages.
    api.setOptions({selfListen: true});

    // Listener
    api.listen(function callback(err, message) {

        // Checking if the message sent was a text message (vs GIF, for example)
        if (message.type == 'message'){
            console.log("Messaged recieved: " + message.body);

            // "Hello, I am Ishaan" becomes an array of ["Hello,", "I", "am",
            // "Ishaan"]
            wordArray = message.body.split(" ");

            // Initialize hex value and iterate through the word array looking for
            // a valid color.
            var hex;
            wordArray.forEach(function (word){
                /* !hex: Makes sure we haven't already found a color. This
                 * means that the counted color will be the first one.
                 * toHex(word): Uses the `colornames` module to convert 
                 * the word to a hex value. If it's not a valid color, 
                 * it returns undefined, and the if statement is evaluated 
                 * as false.
                 */
                if (!hex && toHex(word)){
                    console.log("Color found: " + word)
                    hex = toHex(word);
                }
            });

            // This is a regular expression matching any string that has 4
            // chars followed by 3 digits.
            var regex = /\w{4}\d{3}/;
            var course;
            wordArray.forEach(function (word){
                /* !course: Makes sure we have't already found a cours. This
                 * means that the counted course will be the first one.
                 * word.match(regex): Checking if a word is in the desired
                 * format.
                 */
                if (!course && word.match(regex)){
                    console.log("Course found: " + word)
                    course = word;
                }
            });

            // If we found a color:
            if (hex){
                console.log("Desired hex: " + hex);
                api.changeThreadColor(hex, message.threadID, function callback(err) {
                    if(err) return console.error(err);
                    console.log("Setting color to " + hex);
                });
            }

            // If we found a course:
            if (course){
                // Make the HTTP request to umd.io with the course
                request('http://api.umd.io/v0/courses/' + course, function (error, response, body) {
                    // If we don't have errors from the response, continue:
                    if (!error && response.statusCode == 200) {
                        // Converting the (string) body of the response to json
                        var jsonRes = JSON.parse(response.body);
                        if (response.body){
                            // Returning the description (if found)
                            api.sendMessage("INFORMATION ABOUT " + course + ":\n\n" + jsonRes.description, message.threadID);
                        } else {
                            api.sendMessage("INFORMATION ABOUT " + course + ":\n\nClass not found", message.threadID);
                        }
                    } else {
                        console.log("Got weird class from fb message...")
                    }
                });
            }
        } else {
            console.log("Not message!")
        }
    });
});
