# Guia para rodar o projeto do estoque da ONG

Este guia foi escrito para quem nunca trabalhou com TI. A ideia é seguir uma etapa por vez, sem pressa.

## 1. O que este projeto tem

O projeto tem três partes principais:

- Banco de dados PostgreSQL: guarda produtos, entradas, saídas, usuários, alertas e auditoria.
- Backend Node.js: é a API, ou seja, a parte que conversa com o banco e aplica as regras do estoque.
- App mobile React Native/Expo: é a tela usada no celular ou no navegador para operar o estoque.

As pastas principais são:

```text
backend   API do sistema
mobile    Aplicativo React Native
modelo    Arquivo Python do modelo de machine learning
```

## 2. Programas que você precisa instalar

Antes de rodar o projeto, instale estes programas:

### 2.1. Node.js

O Node.js é necessário para rodar o backend e o app.

1. Acesse: https://nodejs.org
2. Baixe a versão LTS.
3. Instale clicando em Next/Avançar até finalizar.
4. Feche e abra novamente o terminal depois da instalação.

Para testar se deu certo, abra o PowerShell e digite:

```powershell
node -v
```

Depois digite:

```powershell
npm -v
```

Se aparecerem números de versão, está tudo certo.

### 2.2. Docker Desktop

O Docker será usado para subir o PostgreSQL sem precisar instalar o banco manualmente.

1. Acesse: https://www.docker.com/products/docker-desktop
2. Baixe o Docker Desktop para Windows.
3. Instale.
4. Reinicie o computador se o instalador pedir.
5. Abra o Docker Desktop e espere ele terminar de iniciar.

Para testar, abra o PowerShell e digite:

```powershell
docker --version
```

Se aparecer uma versão, deu certo.

### 2.3. Expo Go no celular

Para testar o app no celular:

1. Abra a loja de aplicativos do celular.
2. Procure por Expo Go.
3. Instale o aplicativo.

Também é possível testar no navegador, mas o celular é mais próximo do uso real.

## 3. Abrindo a pasta do projeto

Abra o PowerShell.

Depois entre na pasta do projeto com o comando abaixo:

```powershell
cd "C:\Users\Monise\OneDrive\Área de Trabalho\PI\TESTE APP"
```

Atenção: as aspas são importantes porque o caminho tem espaços e acentos.

Para confirmar que está no lugar certo, digite:

```powershell
dir
```

Você deve ver pastas como:

```text
backend
mobile
modelo
```

## 4. Subindo o banco de dados

Ainda na pasta principal do projeto, rode:

```powershell
docker compose up -d
```

Esse comando cria e liga o PostgreSQL.

Para verificar se o banco está rodando, digite:

```powershell
docker ps
```

Você deve ver algo parecido com:

```text
ong-stock-postgres
```

## 5. Configurando o backend

Entre na pasta do backend:

```powershell
cd backend
```

Crie o arquivo de configuração `.env` copiando o exemplo:

```powershell
Copy-Item .env.example .env
```

Instale as dependências:

```powershell
npm install
```

Esse comando pode demorar alguns minutos.

Agora crie as tabelas no banco:

```powershell
npm run migrate
```

Depois crie os dados iniciais:

```powershell
npm run seed
```

Esse comando cria um usuário administrador:

```text
E-mail: admin@ong.org
Senha: Admin@123
```

Agora ligue o backend:

```powershell
npm run dev
```

Se tudo estiver certo, aparecerá uma mensagem parecida com:

```text
API de estoque ouvindo na porta 3333
```

Importante: deixe essa janela do PowerShell aberta. Se fechar, o backend para.

## 6. Testando se o backend está funcionando

Abra o navegador e acesse:

```text
http://localhost:3333/health
```

Se aparecer algo parecido com isto, o backend está funcionando:

```json
{
  "status": "ok",
  "service": "ong-stock-backend"
}
```

## 7. Rodando o app mobile

Abra uma nova janela do PowerShell.

Entre novamente na pasta principal do projeto:

```powershell
cd "C:\Users\Monise\OneDrive\Área de Trabalho\PI\TESTE APP"
```

Entre na pasta do app:

```powershell
cd mobile
```

Instale as dependências:

```powershell
npm install
```

Agora inicie o app:

```powershell
npm start
```

O Expo abrirá uma tela no terminal e normalmente também abrirá uma página no navegador.

## 8. Abrindo o app no celular

Para abrir no celular:

1. Garanta que o computador e o celular estejam no mesmo Wi-Fi.
2. Abra o app Expo Go no celular.
3. Escaneie o QR Code que apareceu no terminal ou no navegador.

Se o celular não conseguir conectar usando `localhost`, será preciso usar o IP do computador.

## 9. Usando o IP do computador no celular

No PowerShell, rode:

```powershell
ipconfig
```

Procure por uma linha chamada `Endereço IPv4`.

Ela será parecida com:

```text
192.168.0.25
```

Agora, na pasta `mobile`, pare o Expo apertando:

```text
Ctrl + C
```

Depois rode novamente usando o IP encontrado:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.0.25:3333"; npm start
```

Troque `192.168.0.25` pelo IP real do seu computador.

## 10. Entrando no app

Na tela de login, use:

```text
E-mail: admin@ong.org
Senha: Admin@123
```

Depois de entrar, você verá as abas:

- Estoque
- Entrada
- Saída
- Produto
- Armazém
- Alertas

## 11. Primeiro uso recomendado

Siga esta ordem para cadastrar dados:

1. Vá em Armazém.
2. Cadastre um armazém, por exemplo: `Depósito Principal`.
3. Cadastre uma localização, por exemplo: `A1-P1`.
4. Vá em Produto.
5. Cadastre um doador.
6. Cadastre um produto.
7. Vá em Entrada.
8. Registre uma entrada de estoque.
9. Vá em Estoque.
10. Confira se o saldo apareceu.
11. Vá em Saída.
12. Registre uma saída menor ou igual ao saldo disponível.

O sistema não permite saída maior que o estoque disponível.

## 12. Como parar o projeto

Para parar o backend ou o app, vá até a janela do PowerShell onde ele está rodando e aperte:

```text
Ctrl + C
```

Para parar o banco de dados:

```powershell
cd "C:\Users\Monise\OneDrive\Área de Trabalho\PI\TESTE APP"
docker compose down
```

## 13. Como ligar tudo novamente outro dia

Quando quiser usar de novo:

1. Abra o Docker Desktop.
2. Abra o PowerShell.
3. Entre na pasta do projeto:

```powershell
cd "C:\Users\Monise\OneDrive\Área de Trabalho\PI\TESTE APP"
```

4. Ligue o banco:

```powershell
docker compose up -d
```

5. Ligue o backend:

```powershell
cd backend
npm run dev
```

6. Em outra janela do PowerShell, ligue o app:

```powershell
cd "C:\Users\Monise\OneDrive\Área de Trabalho\PI\TESTE APP\mobile"
npm start
```

## 14. Problemas comuns

### `node` não é reconhecido

O Node.js não foi instalado ou o terminal foi aberto antes da instalação.

Solução:

1. Instale o Node.js LTS.
2. Feche o PowerShell.
3. Abra o PowerShell de novo.
4. Teste com:

```powershell
node -v
```

### `docker` não é reconhecido

O Docker Desktop não foi instalado ou não está aberto.

Solução:

1. Instale o Docker Desktop.
2. Abra o Docker Desktop.
3. Espere ele iniciar.
4. Teste com:

```powershell
docker --version
```

### Porta 5432 já está em uso

Já existe outro PostgreSQL rodando na máquina.

Solução simples:

1. Feche outros bancos PostgreSQL se souber quais são.
2. Rode novamente:

```powershell
docker compose up -d
```

### Erro: autenticação do tipo senha falhou para o usuário "postgres"

Esse erro aparece quando o backend tenta entrar no PostgreSQL com usuário e senha, mas o banco que respondeu não aceitou a senha.

Mensagem parecida:

```text
password authentication failed for user "postgres"
```

Ou em português:

```text
autenticação do tipo senha falhou para o usuário "postgres"
```

As causas mais comuns são:

- Já existe um PostgreSQL instalado no computador usando a porta `5432`.
- O Docker criou o banco antes com outra senha e guardou os dados antigos.
- O arquivo `backend/.env` está com uma senha diferente da senha do banco.

Primeiro, confira o arquivo:

```powershell
cd "C:\Users\Monise\OneDrive\Área de Trabalho\PI\TESTE APP\backend"
notepad .env
```

Veja se existe esta linha:

```text
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ong_stock
```

Se estiver diferente, ajuste, salve e tente:

```powershell
npm run migrate
```

Se continuar dando erro e você ainda não tem dados importantes nesse banco, faça o reset do banco Docker:

```powershell
cd "C:\Users\Monise\OneDrive\Área de Trabalho\PI\TESTE APP"
docker compose down -v
docker compose up -d
cd backend
npm run migrate
npm run seed
```

Atenção: o comando `docker compose down -v` apaga os dados do banco Docker deste projeto.

Se você tiver outro PostgreSQL instalado no computador, uma alternativa é usar a porta `5433` para o Docker.

Abra o arquivo `docker-compose.yml` e troque:

```text
"5432:5432"
```

por:

```text
"5433:5432"
```

Depois abra `backend/.env` e troque:

```text
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ong_stock
```

por:

```text
DATABASE_URL=postgres://postgres:postgres@localhost:5433/ong_stock
```

Então rode:

```powershell
cd "C:\Users\Monise\OneDrive\Área de Trabalho\PI\TESTE APP"
docker compose down
docker compose up -d
cd backend
npm run migrate
npm run seed
```

### Porta 3333 já está em uso

Outro programa está usando a porta do backend.

Solução:

1. Abra `backend/.env`.
2. Troque:

```text
PORT=3333
```

por:

```text
PORT=3334
```

3. No mobile, use:

```powershell
$env:EXPO_PUBLIC_API_URL="http://SEU_IP:3334"; npm start
```

### O app abre, mas não faz login

Possíveis causas:

- O backend não está rodando.
- O celular não está no mesmo Wi-Fi do computador.
- O app está tentando acessar `localhost`, que no celular significa o próprio celular.

Solução:

1. Confirme se o backend está aberto em:

```text
http://localhost:3333/health
```

2. Use o IP do computador com `EXPO_PUBLIC_API_URL`.

### Erro: Project is incompatible with this version of Expo Go

Esse erro aparece no celular quando a versão do Expo Go instalada não combina com a versão do projeto.

No caso da imagem, o celular está com:

```text
Expo Go SDK 54
```

Mas o projeto estava com:

```text
Expo SDK 52
```

O jeito mais simples é atualizar o projeto para SDK 54.

Abra o PowerShell e rode:

```powershell
cd "C:\Users\Monise\OneDrive\Área de Trabalho\PI\TESTE APP\mobile"
```

Pare o Expo se ele estiver rodando. Para parar, aperte:

```text
Ctrl + C
```

Depois rode:

```powershell
npm install expo@^54.0.0
npx expo install --fix
npm start -- --clear
```

Se ainda continuar dando erro, limpe a instalação antiga e instale tudo de novo:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npx expo install --fix
npm start -- --clear
```

Depois escaneie o QR Code novamente no Expo Go.

Se o celular não conectar na API depois disso, lembre de iniciar usando o IP do computador:

```powershell
$env:EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:3333"; npm start -- --clear
```

### Erro ao rodar `npm install`

Pode ser internet instável ou bloqueio de rede.

Solução:

1. Verifique a internet.
2. Rode de novo:

```powershell
npm install
```

## 15. Sobre o modelo de machine learning

O arquivo do modelo está em:

```text
modelo/modelo_learnig.py
```

O backend já tem um local preparado para futura integração:

```text
backend/src/services/mlClassificationService.js
```

Neste momento, o backend ainda não chama o modelo Python. Ele usa uma regra local temporária para classificar os itens como:

- Consumo Imediato
- Seguro
- Risco de Vencimento

Quando o modelo estiver na nuvem, a integração deve ser feita nesse arquivo de serviço.
