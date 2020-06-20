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

const meChatId = '5544988484931@c.us';
const brendaChatId = '554488413398@c.us';
const groupChatId = '554498401456-1579545386@g.us'; 

let waitingResponseConflict = false;
let errorUnderstandingMessage = false;
let waitingToReconect = false;
let conflictConnection = false;
let reconnectingAfterWaiting = false;

client.on('ready', async () => {
    console.log('ready');

    if (reconnectingAfterWaiting) {
        reconnectingAfterWaiting = false;
        await client.sendMessage(meChatId, "Estou de volta");
        console.log('success');
    }

    if (conflictConnection == true) {
        conflictConnection = false;
        await client.sendMessage(meChatId, "Oi André, aqui é o cornobot, infelizmente não podemos usar o whatsapp web juntos :( caso queria me desconectar me responda com 'desconecte', se não digite quanto tempo quer utilizar o whatsapp web (em minutos).");
        waitingResponseConflict = true;
    }

    // try {
    //     const msg = await client.sendMessage("5544988484931@c.us", "Teste");
    //     waitingResponse = true;

    //     //console.log(msg);
    // } catch (e) {
    //     console.error("Could not send message to your self");
    //     console.error(e);
    // }

    // const chats = await client.getChats();
    // console.log(chats.filter(chat => chat.name.toLowerCase().includes('minha brenda')));
    // const chat = new Chat();
    // const groupChat = await client.getChatById('554498401456-1579545386@g.us');
    // console.log(groupChat);
});

client.on('message_create', async msg => {
    if (msg.fromMe && msg.to == meChatId) {
        if (msg.body.toLowerCase().includes('hello')) {
            await msg.reply("world");
        }
    }

    if (msg.body.toLowerCase() == 'desconecte') {
       await msg.reply("Tchau tchau...");
       client.destroy();
    }

    if (msg.fromMe && msg.to == meChatId && waitingResponseConflict) {
        if (waitingResponseConflict) {
            waitingResponseConflict = false;
            timeToReconnect = parseInt(msg.body);
            if (isNaN(timeToReconnect)) {
                errorUnderstandingMessage = true;
                await msg.reply("Não entendi, por favor digite só os minutos que deseja ficar conectado, ou 'desconecte' para eu ser desconectado");
            } else {
                waitingToReconect = true;
                await msg.reply("Ok, você já pode abrir o whatsapp web, até mais...");
                console.log(timeToReconnect * 60 * 1000 + " milisegundos");
                client.destroy();
                setTimeout(function() {
                    waitingToReconect = false;
                    reconnectingAfterWaiting = true;
                    console.log('reconnecting after waiting');
                    client.initialize();
                }, timeToReconnect * 60 * 1000);
            }
        } else if (errorUnderstandingMessage) {
            errorUnderstandingMessage = false;
            waitingResponseConflict = true;
        }
    }
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



client.on('disconnected', async (error) => {
    console.log('disconnected ' + error);
    if (error == 'TIMEOUT') {
        console.log('reconnecting...');
        client.initialize();
    }

    if (error == 'CONFLICT') {
        if (!waitingToReconect) {
            console.log('reconnecting...');
            client.initialize();
            conflictConnection = true;
        }
    }
});

try {
    console.log("initializing");
    client.initialize();
} catch (e) {
    console.log("error on initializing");
}
