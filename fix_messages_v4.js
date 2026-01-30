const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/api/data/messages.json');

try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const messages = JSON.parse(raw);

    const targetMsg = messages.find(m => m.id === 'msg-pagamento-intro');
    if (targetMsg) {
        console.log('Mensagem encontrada. Botões atuais:', targetMsg.buttons.length);
        
        // Verifica se já tem o botão para evitar duplicação ou se preciso adicionar
        if (targetMsg.buttons.length < 2) {
             console.log('Adicionando segundo botão para compatibilidade com Enquete...');
             targetMsg.buttons.push({
                 id: `btn-${Date.now()}`,
                 label: 'Cancelar',
                 response: 'Operação cancelada',
                 nextMessage: 'Boas Vindas' // Retorna ao início
             });
             
             fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
             console.log('Botão "Cancelar" adicionado com sucesso!');
        } else {
            console.log('Mensagem já possui 2 ou mais botões.');
        }

    } else {
        console.error('Mensagem msg-pagamento-intro não encontrada.');
    }

} catch (error) {
    console.error('Erro:', error.message);
}
