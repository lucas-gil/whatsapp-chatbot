# 🆘 Troubleshooting & Soluções Rápidas

## ⚡ Problemas Comuns & Soluções

### ❌ Problema: "npm: command not found" ou Node.js não instalado

**Solução:**
1. Baixe Node.js em https://nodejs.org/
2. Instale a versão LTS (recomendado v18+)
3. Reinicie o terminal após instalar
4. Teste com: `node --version`

---

### ❌ Problema: "EADDRINUSE: Address already in use :::3000"

**Causa:** Outra aplicação está usando a porta 3000

**Soluções:**

**Windows:**
```powershell
# Encontrar qual processo está usando a porta
netstat -ano | findstr :3000

# Resultado: TCP  0.0.0.0:3000  0.0.0.0:0  LISTENING  12345

# Matar o processo (substitua 12345)
taskkill /PID 12345 /F
```

**Mac/Linux:**
```bash
# Encontrar qual processo
lsof -i :3000

# Resultado: node 12345 user  4u  IPv6 0x... 0t0 TCP *:3000 (LISTEN)

# Matar o processo
kill -9 12345
```

**Alternativa:** Use outra porta
```bash
PORT=3002 npm run dev
# Admin estará em: http://localhost:3002 (se usar Next.js direto)
```

---

### ❌ Problema: "Cannot find module 'baileys'"

**Causa:** Dependências não foram instaladas

**Solução:**
```bash
# Reinstale tudo
rm -rf node_modules
npm install

# Ou apenas a dependência
npm install @whiskeysockets/baileys
npm install baileys
```

---

### ❌ Problema: "QR Code não aparece no navegador"

**Possíveis Causas e Soluções:**

**1. API não está rodando**
```bash
# Verifique se http://localhost:3000/health responde
curl http://localhost:3000/health

# Deve retornar:
# {"status":"ok","connectionsActive":0}

# Se não responder, reinicie:
# Ctrl+C no terminal onde npm run dev está rodando
npm run dev
```

**2. Frontend não consegue acessar a API**
```bash
# Verifique o console do navegador (F12)
# Procure por erro de CORS

# Se houver erro de CORS, o problema é configuração de porta
# Verifique que está acessando http://localhost:3001 (admin)
# E API está em http://localhost:3000
```

**3. QR code está demorando para gerar**
- Aguarde até 10 segundos
- Se não aparecer, atualize a página (F5)
- Tente gerar novamente

---

### ❌ Problema: "Mensagens não chegam / Auto-reply não funciona"

**Checklist:**
1. [ ] WhatsApp está conectado? (vê "Conectado!" na interface?)
2. [ ] Envie uma mensagem DE OUTRO WhatsApp
3. [ ] A mensagem aparece na lista?
4. [ ] Aparece resposta automática?

**Se não aparecer mensagem:**

**Solução 1: Verifique os logs**
```bash
# No terminal onde npm run dev está rodando
# Procure por: "📩 Mensagem recebida"

# Se não aparecer:
# - O WhatsApp pode estar em offline
# - A sessão pode ter expirado
# - Tente desconectar e reconectar
```

**Solução 2: Teste com curl**
```bash
# Teste se a API está respondendo
curl http://localhost:3000/api/whatsapp/sessions

# Deve retornar:
# {"success":true,"sessions":[{"id":"session_123...","phoneNumber":"55..."}]}
```

**Solução 3: Reconecte**
1. Clique em "Desconectar"
2. Gere novo QR code
3. Escaneie novamente

---

### ❌ Problema: "TypeScript compilation error"

**Causa:** Código TypeScript tem erros

**Solução:**
```bash
# Se vir erro como "Type 'any' is not assignable to type 'never'"
# Edite o arquivo indicado e adicione type casting

# Exemplo:
const sessionId = request.params as any;
const { sessionId } = request.params as any;
```

---

### ❌ Problema: "Cannot GET /" ou página branca no admin

**Causa:** Next.js admin não iniciou

**Solução:**
```bash
# Reinicie
Ctrl+C
npm run dev

# Aguarde a mensagem:
# ✓ Ready in X.X seconds
# ✓ Compiled successfully

# Depois acesse http://localhost:3001
```

---

### ❌ Problema: "Connection refused" ao conectar

**Causa:** Firewall ou proxy bloqueando

**Soluções:**
1. Verifique firewall do Windows/Mac/Linux
2. Tente desabilitar temporariamente para teste
3. Adicione exceção para Node.js no firewall
4. Se em rede corporativa, fale com TI

---

### ❌ Problema: "Sessão expirada" após 24 horas

**Causa:** Credenciais expiram automaticamente

**Solução:**
1. Gere novo QR code
2. Escaneie novamente
3. Sistema criará nova sessão

**Para manter sessão ativa:**
- Deixe o WhatsApp conectado no computador
- Não feche a aplicação
- Se fechar, reconecte ao iniciar

---

### ❌ Problema: "Erro ao enviar broadcast"

**Causa:** Nenhuma mensagem foi recebida ainda

**Solução:**
1. Receba pelo menos uma mensagem primeiro
2. Depois envie broadcast
3. Broadcast funciona apenas para contatos que já conversaram

---

### ❌ Problema: "Credenciais corrompidas"

**Sintomas:**
- QR code não funciona
- Erro "Invalid session state"
- Falha ao conectar

**Solução:**
```bash
# Delete a pasta de credenciais e recrie
# Windows:
rmdir /s /q apps\api\baileys-auth

# Mac/Linux:
rm -rf apps/api/baileys-auth

# Depois gere novo QR code
npm run dev
```

---

### ❌ Problema: "Package.json lock file outdated"

**Solução:**
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ Testes de Funcionamento

### Teste 1: Health Check
```bash
curl http://localhost:3000/health
```

**Esperado:**
```json
{"status":"ok","connectionsActive":0}
```

---

### Teste 2: Listar Sessões
```bash
curl http://localhost:3000/api/whatsapp/sessions
```

**Esperado:**
```json
{"success":true,"sessions":[]}
```

---

### Teste 3: Verificar Admin
Abra http://localhost:3001 no navegador e veja se carrega.

---

## 📊 Checklist de Diagnóstico

Se algo não funcionar, verifique em ordem:

- [ ] Node.js instalado? `node --version`
- [ ] npm instalado? `npm --version`
- [ ] Dependências instaladas? `npm install` feito?
- [ ] Portas liberadas? `netstat -ano | findstr :3000 :3001`
- [ ] npm run dev iniciou sem erro?
- [ ] Admin carrega em http://localhost:3001?
- [ ] API responde em http://localhost:3000/health?
- [ ] Botão "Gerar QR Code" aparece?
- [ ] QR code foi gerado?
- [ ] Conseguiu escanear com WhatsApp?

Se tudo for ✅, o sistema está funcionando!

---

## 🔍 Logs Úteis

### Procure por Estes Padrões

**Bom Sinal ✅:**
```
✓ QR Code gerado
✅ WhatsApp conectado
📩 Mensagem recebida
✓ Broadcast enviado
✅ RESPOSTA ENVIADA COM SUCESSO
```

**Sinal de Problema ❌:**
```
EADDRINUSE    → Porta em uso
ENOTFOUND     → Não consegue conectar
Cannot find module → Dependência faltando
ERR!          → Erro npm
```

---

## 💡 Dicas Importantes

1. **Sempre use terminal recente**: Feche e abra novo após instalar Node.js
2. **Aguarde o QR**: Pode levar até 10 segundos na primeira vez
3. **Uma sessão por vez**: Não tente gerar vários QR codes ao mesmo tempo
4. **Keep it running**: Deixe npm run dev rodando o tempo todo
5. **Backup de credenciais**: Copie a pasta `baileys-auth/` regularmente

---

## 📞 Se Nada Funcionar

1. **Reinicie tudo:**
   ```bash
   Ctrl+C no terminal
   npm install
   npm run dev
   ```

2. **Limpe cache:**
   ```bash
   # Windows
   del /Q node_modules
   rmdir /s node_modules
   npm install
   
   # Mac/Linux
   rm -rf node_modules
   npm install
   ```

3. **Reinstale Node.js:**
   - Desinstale completamente
   - Reinstale versão LTS mais recente

4. **Crie uma nova pasta do projeto:**
   - Copie novamente os arquivos
   - Instale do zero

---

## 🎯 Resultado Esperado

Após seguir estes passos, você deve ter:

✅ Terminal mostrando:
```
✓ Servidor rodando em http://localhost:3000
✓ Admin rodando em http://localhost:3001
✅ Chatbot IPTV iniciado com sucesso!
```

✅ Navegador mostrando:
```
Admin Dashboard carregado
Botão "Gerar QR Code REAL" visível
Interface responsiva
```

✅ WhatsApp:
```
QR code escaneado
Status: Conectado
Auto-reply funcionando
```

Se tudo isso aconteceu: **🎉 SUCESSO! Sistema 100% funcional!**

---

*Última atualização: 2024*
*Versão: 1.0.0*
