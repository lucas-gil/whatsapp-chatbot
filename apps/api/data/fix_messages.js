const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\tranf\\whatsapp-chatbot\\apps\\api\\data\\messages.json';

try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    const targetId = "msg-1769004005537";
    const index = data.findIndex(m => m.id === targetId);

    if (index === -1) {
        console.log("Message not found!");
        process.exit(1);
    }

    const targetMsg = data[index];
    console.log(`Found message: ${targetMsg.title}`);

    // Create Step 1
    const step1Msg = {
        id: "msg-pagamento-intro",
        title: "pagamento",
        content: targetMsg.content,
        image: targetMsg.image,
        buttons: [
            {
                id: "btn-ver-pix",
                label: "Ver Chave PIX",
                response: "Mostrando chave PIX"
            }
        ],
        edited: false
    };

    // Create Step 2
    const step2Msg = {
        id: "msg-pagamento-poll",
        title: "Mostrando chave PIX",
        content: "Escolha uma opção abaixo:",
        buttons: targetMsg.buttons,
        edited: false
    };

    // Remove old and add new
    data.splice(index, 1, step1Msg, step2Msg);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log("Success! messages.json updated.");

} catch (e) {
    console.error("Error:", e);
}
