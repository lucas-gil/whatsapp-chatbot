const fs = require('fs');
const filePath = 'c:\\Users\\tranf\\whatsapp-chatbot\\apps\\api\\data\\messages.json';

try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    // Find step 1
    const step1Id = "msg-pagamento-intro";
    const step1 = data.find(m => m.id === step1Id);

    if (step1) {
        console.log("Updating Step 1 content...");
        // Shorten content to fit Poll Title limit
        step1.content = "Realize o pagamento via PIX e envie o comprovante."; // ~50 chars
        
        // Also ensure Step 2 (Result) is correct
        const step2Id = "msg-pagamento-poll";
        const step2 = data.find(m => m.id === step2Id);
        
        if (step2) {
             // Step 2 is fine, just listing keys
             console.log("Step 2 found, leaving as is.");
        }
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log("Updated messages.json with shorter title.");
    } else {
        console.log("Step 1 not found to update.");
    }

} catch (e) {
    console.error(e);
}
