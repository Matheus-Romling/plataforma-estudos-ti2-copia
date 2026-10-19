# Código da plataforma Quorbe

O projeto usa um único servidor Express, iniciado pelo `package.json` da raiz.

```text
codigo/
├── servidor.js          # Servidor das páginas e APIs
├── db/
│   ├── db.json          # Banco utilizado pela plataforma
│   └── db.json.example  # Exemplo de dados da loja
└── public/
    ├── index.html       # Login
    ├── loja.html        # Loja de cosméticos
    ├── perfil.html      # Página de perfil compartilhada
    ├── tarefas.html     # Gerenciamento de tarefas
    ├── aluno/           # Páginas do aluno
    ├── professor/       # Páginas do professor
    └── assets/
        ├── css/         # Estilos comuns e de cada funcionalidade
        ├── js/          # Scripts executados pelo navegador
        └── images/      # Imagens dos cosméticos
```

## Executar

Na raiz de `plataforma-estudos-ti2-copia`:

```powershell
npm install
npm start
```

Abra `http://localhost:3000/`. A loja está em `/loja.html`, o gerenciamento de tarefas em `/tarefas.html` e as turmas em `/professor/turmas.html`.

O servidor atende ao login, às coleções REST do banco JSON e à API da loja na mesma porta. O banco fica fora de `public`; os dados são acessados pelas APIs. A variável de ambiente `PORT` permite alterar a porta.

As páginas vazias em `aluno/` e `professor/` representam funcionalidades ainda em desenvolvimento e foram mantidas porque os menus apontam para elas. A página de tarefas do professor encaminha para o gerenciamento compartilhado.

As versões antigas, arquivos de teste, exemplos do template e cópias duplicadas foram removidos desta cópia local. A documentação acadêmica continua em `docs/`, e os modelos de documentos continuam em `templates/`, na raiz.
