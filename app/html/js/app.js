const apiHost = "https://csc346chat.test.apps.uits.arizona.edu"

/************************
 * PART 2 
 * Replace the placeholder URL with the Function URL 
 * with your generate upload URL Lambda Function
 ************************/
const imgHost = "https://ezrf3zy7wqnn5yuxmbpvobjsjm0mtkor.lambda-url.us-east-1.on.aws/"

window.addEventListener("load", () => {
    setup()
    loadChats()
    checkLoginTicket()
})

var chatApi = new ChatAPI()
var sessionStorage = window.sessionStorage
var locationURL = new URL(document.location)
var user = null
var authJWT = null
var newestChatTimestamp = null
var oldestChatTimestamp = null

function setup() {
    // Check local storage to see if we're logged in
    // {"status":"OK","jwt":"...","username":"fischerm"}
    if (sessionStorage.getItem("user")) {
        user = sessionStorage.getItem("user")
        authJWT = sessionStorage.getItem("authJWT")
        updateLoginButton(user)
    } else {
        updateLoginButton()
    }

    // Attach a click handler to the new chat button
    const newChatButton = document.getElementById("newchatbutton")
    newChatButton.addEventListener("click", handleNewChat)

    // Attach a click handler to the load older chats button
    const olderChatsButton = document.getElementById("olderchatsbutton")
    olderChatsButton.addEventListener("click", handleOlderChats)

    // Attach the close modal image function to the modal overlay
    const modalElement = document.getElementById("imagemodal")
    modalElement.addEventListener("click", closeModalImage)
}

/************************
 * PART 2
 * Complete the implimentation of the checkUploadImage function.
 ************************/
async function checkUploadImage() {
    // See if we have a file selected in the imageupload element
    const fileElement = document.getElementById("imageupload")
    const files = fileElement.files
    if (!files.length) {
        return await Promise.resolve(undefined)
    }

    var fileName

    /************************
     * PART 2
     * There should only be one file available, so get a reference 
     * to the only element of the 'files' array, and then get the name
     * of the file and store it in the fileName variable declared above.
     * See https://developer.mozilla.org/en-US/docs/Web/API/File for
     * details on the File objects in the files array.
     ************************/
     const imageFile = files[0]; 
     fileName = imageFile.name;


    /************************
     * PART 2
     * Because filenames may have spaces or other unsafe URL characters
     * I recomend using the encodeURIComponent() function to make this URL
     * safe, since you will need to append this as the 'filename' query
     * string parameter.
     * 
     * Also replace any spaces, '+' and '%20' sequences in the file name 
     * with a dash using the fileName.replaceAll() method. 
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll 
     ************************/
     fileName = encodeURIComponent(fileName);
     fileName = fileName.replaceAll(/'+'|'%20'|\s/g,"-");


    /************************
     * PART 2
     * Call your imgHost API URL to generate a signed upload URL using 
     * the fetch() API. Use 'await' to wait for the result of the fetch()
     * promise to resolve. Don't forget to resolve the .json() balue of 
     * the promise. The resulting javascript object should have four keys
     * returned from your generate upload URL function: 
     *      - status
     *      - upload_url
     *      - thumbnail_url
     *      - full_url 
     ************************/
     const generateUploadURL = imgHost + "/?filename=" + fileName; 
     const generateUploadResponse = await fetch(generateUploadURL).then(response => response.json());
     const signedUploadURL = generateUploadResponse["upload_url"];


    /************************
     * PART 2
     * Once the generateUploadURL API call has resolved, you now have your 
     * signedUploadURL which you can use to upload the image file directly
     * to the S3 bucket. Remember this has to be a PUT command, and the
     * 'imageFile' variable must be passed as the body of the request.
     ************************/
    const options = {
        method: 'PUT',
        body: imageFile
    }
     const uploadReponse = await fetch(signedUploadURL, options);


    /************************
     * PART 2
     * Return the generateUploadResponse object, as we'll need the full_url
     * and thumbnail_url when we send the new chat data in Part 2.
     ************************/
    return generateUploadResponse
}


async function checkLoginTicket() {
    let params = locationURL.searchParams

    let service = locationURL.origin + "/"

    if (params.has("ticket")) {
        let ticket = params.get("ticket")
        loginResponse = await chatApi.authenticate(ticket, service)
        handleLogin(loginResponse)
    } else {
        console.log("No Ticket")
    }
}


async function loadChats(startTime=null, endTime=null) {
    var chat_response = null
    if (endTime != null) {
        chat_response = await chatApi.getChatsBefore(endTime)
    } else {
        chat_response = await chatApi.getChat(startTime)
    }

    if (chat_response == undefined) {
        console.error("chat_response not set")
        return
    }

    if (chat_response.status != "OK") {
        console.error(chat_response.message)
        return
    }

    chats = chat_response.messages

    var position = "end"
    if (startTime != null) {
        position = "beginning"
    }

    chats.forEach(chat => {
        makeNewChatElement(chat, position=position)
    });

}

function makeNewChatElement(chat, position="end") {
    if (newestChatTimestamp == null) {
        newestChatTimestamp = chat.timestamp
    } else if (chat.timestamp > newestChatTimestamp) {
        newestChatTimestamp = chat.timestamp
    }

    if (oldestChatTimestamp == null) {
        oldestChatTimestamp = chat.timestamp
    } else if (chat.timestamp < oldestChatTimestamp) {
        oldestChatTimestamp = chat.timestamp
    }

    let container = document.getElementById("chatcontainer")

    let newChat = document.createElement("div")
    newChat.classList.add("list-group-item")

    let chatUsername = document.createElement("small")
    d = new Date(Number(chat.timestamp) * 1000)
    chatUsername.textContent = "@" + chat.username + " (" + d.toLocaleDateString() + " " + d.toLocaleTimeString() + ")"

    let chatMessage = document.createElement("div")
    chatMessage.textContent = chat.message

    /************************
     * PART 1
     * Check to see if this chat has an image. If it does
     * create an img element for it.
     * 
     ************************/
    if (chat.image_full_url && chat.image_thumbnail_url) {
        /************************
         * PART 1
         * Create a new 'img' element and assign it to a 
         * variable named chatImageElement.
         * 
         * Set the .src property of the new img element to the 
         * thumbnail URL of the chat message.
         * 
         * Add the following classes to the img element's classList:
         *   - img-fluid
         *   - rounded
         *   - float-right
         * 
         ************************/
         let chatImageElement= document.createElement("img"); 
         chatImageElement.src = chat.image_thumbnail_url; 
         chatImageElement.classList.add("img-fluid", "rounded", "float-right");
        
        /************************
         * PART 1
         * Attach 'click' event listener to the new img element which 
         * will call the showModalImage() function with the full
         * size URL as an argument.
         * 
         ************************/
         chatImageElement.addEventListener("click", ()=>{showModalImage(chat.image_full_url)}); 

        /************************
         * PART 1
         * Append the chatImageElement to the newChat
         * 
         ************************/
         newChat.appendChild(chatImageElement);
    }
    
    newChat.appendChild(chatUsername)
    newChat.appendChild(chatMessage)

    if (position == "end") {
        container.appendChild(newChat)
    } else {
        container.insertBefore(newChat, container.children[0])
    }
}

function handleLogin(loginResponse) {
    // Re-write the URL to remove the ?ticket=ST- login ticket 
    // so you can bookmark or reload the page easily
    window.history.replaceState(null, '', '/')

    user = loginResponse.username
    authJWT = loginResponse.jwt

    // Store the loginResponse in the browser's local storage
    sessionStorage.setItem("user", user)
    sessionStorage.setItem("authJWT", authJWT)

    updateLoginButton(user)
}

function handleLogout() {
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("authJWT")
    user = null
    authJWT = null
    window.location.reload(true)
}

function updateLoginButton(username=null) {
    const loginElement = document.getElementById("userlogin")
    const newChatForm = document.getElementById("newchatcontainer")
    let loginLinkElement = document.createElement("a")
    if (username == null || username == "") {
        // <a href="https://csc346chat.test.apps.uits.arizona.edu/login?service=http://localhost:8080/">Login</a>
        let loginURL = apiHost + "/login?service=" + locationURL.origin + locationURL.pathname
        loginLinkElement.href = loginURL
        loginLinkElement.textContent = "Login"

        // Hide the new chat form
        newChatForm.hidden = true
    } else {
        // Set up a logout link
        let loginURL = "#"
        loginLinkElement.href = loginURL
        loginLinkElement.textContent = "Logout: " + username
        loginLinkElement.addEventListener("click", handleLogout)

        // Show the new chat form
        newChatForm.hidden = false
    }

    while (loginElement.firstChild) {
        loginElement.removeChild(loginElement.firstChild)
    }

    loginElement.appendChild(loginLinkElement)
}

async function handleNewChat(event) {
    // Don't submit the form through the default mechanism
    event.preventDefault()

    /************************
     * PART 2
     * Nothing to change here, but you should know how the 
     * checkUploadImage() function is referenced.
     * 
     * Call checkUploadImage function and store the result in a
     * variable named 'imageData'. The checkUploadImage() function
     * is an async function, so be sure to await it before assignment.
     * 
     * This variable may be undefined if no image was selected for 
     * upload. Otherwise it will be an object containing the 
     * full_url and thumbnail_url properties.
     ************************/
    const imageData = await checkUploadImage()

    const chatTextInputElement = document.getElementById("newchatinput")
    const chatText = chatTextInputElement.value

    /************************
     * PART 3
     * Add the 'imageData' variable as a second argument to the postChat()
     * API call.
     ************************/
    let newChatResponse = await chatApi.postChat(chatText, imageData)

    if (newChatResponse.status != "OK") {
        console.error(newChatResponse.message)
        return
    }

    // If everything worked, clear out the chat input field
    chatTextInputElement.value = ""

    // Load the new chat
    loadChats(newestChatTimestamp, null)
}

async function handleOlderChats(event) {
    // Don't submit the form through the default mechanism
    event.preventDefault()

    // Load the old chats
    loadChats(null, oldestChatTimestamp)
}

function showModalImage(imgSrc) {
    const modalElement = document.getElementById("imagemodal")
    const imgElement = document.getElementById("imagefullsize")
    imgElement.src = imgSrc
    modalElement.style.display = "block"
}

function closeModalImage() {
    const modalElement = document.getElementById("imagemodal")
    modalElement.style.display = "none"
}
