# Roteiro de Visitas

Sistema de roteirização dos vendedores: calendário com arrastar e soltar, códigos de visita (S Seg, Q1 Ter, M3 Qui), roteiro do dia no celular, registro de visita (visitei, vendi, não vendi e motivo, conversa de hoje) e painel de produtividade.

- **Site:** arquivos estáticos (GitHub Pages, gratuito)
- **Banco e login:** Supabase (plano gratuito)
- **Permissões:** o vendedor vê só os clientes da área dele, o supervisor vê a equipe e o administrador vê tudo. Essas regras ficam no próprio banco.

## Implantação (uma vez, cerca de 15 minutos)

### 1. Criar o banco no Supabase
1. Entre em https://supabase.com e crie uma conta com o e-mail corporativo.
2. Clique em **New project**, dê o nome `roteirizacao`, escolha a região **South America (São Paulo)** e defina uma senha do banco.
3. Abra **SQL Editor > New query**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
4. Em outra query, cole `supabase/seed_vendedores.sql` e rode. Isso cadastra os 27 vendedores e você como administrador.
5. Em **Authentication > Sign In / Providers**, desligue **Allow new users to sign up**. Assim, só entra quem você cadastrar.
6. Em **Authentication > Users > Add user > Create new user**, crie o seu login (`vinicius.sato@bateriasmoura.com` + senha) com **Auto Confirm User** marcado.
7. Em **Project Settings > API**, copie a **Project URL** e a **anon public key**.

### 2. Ligar o site ao banco
Cole os dois valores em `config.js`:
```js
supabaseUrl: 'https://xxxx.supabase.co',
supabaseAnonKey: 'eyJ...'
```
Publique a pasta no GitHub Pages: repositório `roteirizacao`, em **Settings > Pages > Deploy from branch main**.

### 3. Carregar a carteira
Entre no site como administrador e abra **Clientes > Importar carteira**. Escolha `dados/Carteira_Clientes_importacao.xlsx`, que já vem com os 4.304 clientes de novembro, ou a Carteira de Clientes do mês (.xlsb). O sistema reconhece as colunas sozinho e deixa você conferir antes de importar.

Para atualizar a carteira todo mês, basta importar de novo. Os clientes existentes recebem os dados novos (status, dias sem compra etc.) e **mantêm o roteiro**. Os clientes novos entram como "não alocados".

### 4. Liberar os vendedores
Para cada pessoa:
1. Em **Usuários > Editar**, preencha o e-mail corporativo.
2. No Supabase, vá em **Authentication > Add user** e crie o login com esse mesmo e-mail e uma senha inicial, marcando **Auto Confirm**.

Para supervisores, use **Novo usuário** com o perfil Supervisor e a equipe, por exemplo `Equipe 01`.

## Como funciona o código de visita
| Código | Significado |
|---|---|
| `S Ter` | Semanal, toda terça |
| `Q1 Ter` | Quinzenal, terças das semanas ímpares |
| `Q2 Ter` | Quinzenal, terças das semanas pares |
| `M3 Qui` | Mensal, quinta-feira da 3ª semana do mês (dias 15 a 21) |

A paridade das semanas segue a semana do ano (ISO) por padrão. Isso pode ser trocado para semana do mês em **Configurações**.

## Arquivos
- `index.html`, `assets/app.css` e `assets/app.js`: o sistema
- `config.js`: ligação com o Supabase (em branco = modo demonstração)
- `supabase/schema.sql`: tabelas, regras de acesso e função de gravação em lote
- `supabase/seed_vendedores.sql`: vendedores da carteira e o administrador
- `dados/Carteira_Clientes_importacao.xlsx`: base pronta para importar
- `dados/demo.json`: base usada só no modo demonstração. **Não suba este arquivo para um repositório público**, porque contém nomes e telefones dos clientes.
