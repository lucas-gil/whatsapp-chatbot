const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/api/data/messages.json');

try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const messages = JSON.parse(raw);

    const targetMsg = messages.find(m => m.id === 'msg-pagamento-intro');
    if (targetMsg) {
        console.log('Mensagem encontrada. Conteúdo atual:', targetMsg.content);
        targetMsg.content = 'Pagamento via PIX';
        console.log('Conteúdo alterado para:', targetMsg.content);
        
        fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
        console.log('Arquivo salvo com sucesso!');
    } else {
        console.error('Mensagem msg-pagamento-intro não encontrada.');
    }

} catch (error) {
    console.error('Erro:', error.message);
}
