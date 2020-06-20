const qrcode = require('qrcode-terminal');
const fs = require('fs');

const { Client, Chat } = require('whatsapp-web.js');

// Path where the session data will be stored
const SESSION_FILE_PATH = './session.json';

// Load the session data if it has been previously saved
let sessionData;
if(fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}

// Use the saved values
const client = new Client({
    session: sessionData,
    puppeteer: {
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Save session values to the file upon successful auth
client.on('authenticated', (session) => {
    console.log("authenticated");
    sessionData = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.log("Error on writing session file")
            console.error(err);
        }
    });
});

client.on('qr', qr => {
    console.log("qr");
    qrcode.generate(qr, {small: true});
});

const brendaChatId = '554488413398@c.us';
const groupChatId = '554498401456-1579545386@g.us'; 

client.on('ready', async () => {
    console.log('ready');

    try {
        await client.sendMessage(5544988484931, "Teste");
    } catch (e) {
        console.error("Could not send message to your self");
        console.error(e);
    }
    // const chats = await client.getChats();
    // console.log(chats.filter(chat => chat.name.toLowerCase().includes('minha brenda')));
    // const chat = new Chat();
    // const groupChat = await client.getChatById('554498401456-1579545386@g.us');
    // console.log(groupChat);
});

client.on('message', async msg => {
    console.log("message received");

    let groupChat = await msg.getChat();
    if (groupChat && groupChat.id._serialized == groupChatId && msg.body.toLowerCase().includes('corno')) {
        let responses = ["oi", "eu", "chamou?", ":'("];

        if (msg.body.toLowerCase().replace(/[\u0300-\u036f]/g, "").includes('andre')) {
            responses.push("corno é tu");
        }

        msg.reply(responses[Math.floor(Math.random() * responses.length)]);
    }
});

client.on('disconnected', () => {
    console.log('disconnected');
    console.log('reconnecting...');
    client.initialize();
});

try {
    console.log("initializing");
    client.initialize();
} catch (e) {
    console.log("error on initializing");
}
