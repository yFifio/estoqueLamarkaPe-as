Lamarka Peças - Sistema de Gerenciamento de Estoque
📖 Sobre o Projeto
Lamarka Peças é uma aplicação web completa e robusta, projetada para o gerenciamento de estoque de um ferro-velho especializado em peças de caminhonetes. O sistema oferece uma interface intuitiva e poderosa para controlar o inventário, registrar vendas, gerenciar clientes e extrair relatórios vitais para o negócio.

A aplicação foi desenvolvida com um backend em Node.js e um frontend em HTML, CSS e JavaScript puro, garantindo performance e facilidade de manutenção.

✨ Funcionalidades Principais
Dashboard Interativo: Visualização rápida dos principais indicadores do negócio: total de peças, itens em estoque, valor total do inventário e lucro total das vendas.

Cadastro Completo de Peças: Adicione novas peças com informações detalhadas como nome, veículo compatível (com sistema de marca/modelo), ano, quantidade, localização, preço de compra e preço de venda.

Busca e Filtros Avançados: Pesquise peças no estoque utilizando múltiplos critérios como nome, veículo, ano, localização e faixa de preço.

Controle de Vendas: Registre vendas de forma simples, com cálculo automático de lucro e baixa no estoque.

Sistema de "Fiado" (Venda a Prazo):

Cadastre clientes.

Associe vendas a um cliente para pagamento futuro.

Consulte a "notinha" de cada cliente com o histórico de compras e saldo devedor.

Quite as dívidas de forma parcial ou total.

Relatórios Inteligentes:

Alertas de Estoque Baixo: Identifique peças que precisam de reposição.

Peças Mais Vendidas: Veja quais itens têm maior saída.

Peças Mais Lucrativas: Descubra quais produtos geram mais lucro.

Histórico Completo de Vendas: Todas as vendas ficam registradas, permitindo uma análise detalhada do fluxo de caixa e performance de produtos.

🛠️ Tecnologias Utilizadas
Este projeto é dividido em duas partes principais: backend e frontend.

Backend:

Node.js: Ambiente de execução para o JavaScript no servidor.

Express: Framework para a criação da API REST.

Sequelize: ORM (Object-Relational Mapper) para interagir com o banco de dados de forma segura e produtiva.

MySQL: Banco de dados relacional para armazenamento permanente dos dados.

Frontend:

HTML5: Estrutura semântica da aplicação.

CSS3: Estilização moderna e responsiva.

JavaScript (Vanilla): Interatividade e comunicação com o backend.

🚀 Como Executar o Projeto
Siga estes passos para configurar e rodar a aplicação no seu ambiente local.

Pré-requisitos
Antes de começar, garanta que você tenha os seguintes softwares instalados:

Node.js: Baixe aqui (versão LTS recomendada).

XAMPP: Baixe aqui. Usaremos o XAMPP para rodar o servidor MySQL de forma simples.

Passo 1: Configuração do Backend
Abra a pasta do projeto e navegue até o diretório backend no seu terminal.

Bash

cd caminho/para/o/projeto/backend
Instale todas as dependências do Node.js listadas no package.json.

Bash

npm install
Passo 2: Configuração do Banco de Dados
Abra o Painel de Controle do XAMPP e inicie o módulo MySQL.

Clique no botão "Admin" do MySQL para abrir o phpMyAdmin no seu navegador.

Crie um novo banco de dados:

Clique em "Novo" no menu lateral.

Nome do banco de dados: lamarka_db

Agrupamento (Collation): utf8mb4_general_ci

Clique em "Criar".

Importante: Verifique a senha do seu usuário root no MySQL. Normalmente, você pode definir ou verificar isso na seção "Contas de usuário" do phpMyAdmin.

Passo 3: Conectar o Backend ao Banco de Dados
Abra o arquivo backend/server.js em um editor de código como o VS Code.

Localize a seção de configuração do Sequelize (próximo à linha 14).

Atualize a senha para corresponder à senha do seu usuário root do MySQL. O código está preparado para a senha 323099, mas você deve alterá-la se a sua for diferente.

JavaScript

// server.js
const sequelize = new Sequelize("lamarka_db", "root", "SUA_SENHA_AQUI", {
  host: "localhost",
  dialect: "mysql",
});
Passo 4: Executar a Aplicação
Inicie o Servidor Backend:
Com o terminal ainda na pasta backend, execute o comando:

Bash

node server.js
Se tudo estiver correto, você verá as mensagens de sucesso no terminal, informando que a conexão foi estabelecida e o servidor está rodando na porta 3000.

Abra o Frontend:
Navegue até a pasta frontend e abra o arquivo index.html diretamente no seu navegador de preferência (Google Chrome, Firefox, etc.).

Pronto! A aplicação estará totalmente funcional, conectada ao seu banco de dados local.

📜 Licença
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
