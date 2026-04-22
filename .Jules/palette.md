## 2024-05-18 - Acessibility in GameHeader

 **Learning:** Icon-only action buttons (like Delete, Edit, Save) in headers and menus are often inaccessible to screen readers without proper aria-labels. Adding descriptive Portuguese aria-labels significantly improves navigation for visually impaired users.

 **Action:** Added `aria-label` attributes to the "Voltar para jogos", "Confirmar nome do jogo", "Cancelar edição", "Editar nome do jogo", and "Excluir jogo" icon buttons in `GameHeader.tsx`.
