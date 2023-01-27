
function ChatAPI() {
    this.apiCall = function(method, action, requiresAuth=false, data=null) {
        let options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        }

        if (requiresAuth) {
            if (authJWT == null) {
                console.error("authJWT is null. Are you logged in?")
                return
            }
            options.headers["Authorization"] = "Bearer " + authJWT
        }

        if (data != null) {
            if (method != "POST" && method != "PUT") {
                console.error("Method not allowed when sending data: " + method)
                return
            }

            options.body = JSON.stringify(data)
        }

        let response = fetch(apiHost + "/" + action, options)
                        .then((response) => {
                            if (response.status != 200) {
                                resp_object = response.json().then((errorJson) => {
                                    throw new Error(response.status + ': ' + errorJson.message)
                                })
                                .catch((error) => { console.error(error) })
                                return "Error status: " + response.status
                            } else {
                                return response.json()
                            }
                        })
                        .catch((error) => { console.error(error) });
        return response
    }

    this.authenticate = function(ticket, service) {
        return this.apiCall("GET", "authenticate/" + ticket + "?service=" + service)
    }

    this.getChat = function(startTime) {
        let action = ""
        if (startTime == null) {
            action = "chat"
        } else {
            action = "chat/after/" + startTime
        }
        return this.apiCall("GET", action)
    }

    this.getChatsBefore = function(endTime) {
        let action = ""
        if (endTime == null) {
            action = "chat"
        } else {
            action = "chat/before/" + endTime
        }
        return this.apiCall("GET", action)
    }

    /************************
     * PART 2
     * Add a second input argument for the 'imageData' passed from app.js
     ************************/
    this.postChat = function(chatText, imageData) {
        // The default payload contains just the chatText.
        var payload = {
            "message": chatText
        }

        /************************
         * PART 2
         * Test to see if imageData is undefined. If it is not
         * undefined, construct a new 'payload' object with keys and values 
         * matching the API specification including the optional image
         * keys.
         ************************/
        if (typeof(imageData) !== "undefined") {
            payload = {
                "message": chatText,
                "image_full_url": imageData["full_url"],
                "image_thumbnail_url":imageData["thumbnail_url"]
            }
        }

        /************************
         * PART 2
         * While testing, it might be helpful to uncomment the following line
         * to temporarily disable new chats from being posted. Don't forget to
         * comment it out again when you're really ready to post your new chat 
         * message with images!
         ************************/
        //return Promise.resolve({"status": "error", "message": "short circuit"})

        return this.apiCall("POST", "chat", true, payload)
    }
}
