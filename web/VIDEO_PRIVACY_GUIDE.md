# Guia de Privacidade de Vídeo - Prospera Academy

Este documento detalha as medidas implementadas para proteger o conteúdo dos cursos e as limitações inerentes ao uso do YouTube como plataforma de hospedagem.

## 🛡️ Medidas de Privacidade Implementadas

Utilizamos o componente `ReactPlayer` com configurações específicas para criar uma experiência "white-label" e dificultar o compartilhamento não autorizado:

1. **Modo de Privacidade Aprimorada**:
   - `modestbranding: 1`: Remove o logo do YouTube da barra de controle.
   - `rel: 0`: Impede a exibição de vídeos relacionados de outros canais ao final da reprodução.
   - `showinfo: 0`: Oculta o título e o uploader do vídeo antes da reprodução.
   - `iv_load_policy: 3`: Desativa anotações de vídeo.

2. **Bloqueio de Interface**:
   - O player é configurado para desencorajar o clique direto para o site do YouTube.
   - O título do vídeo não é clicável na interface padrão.

## ⚠️ Limitações do YouTube

Mesmo com essas configurações, é importante estar ciente de que **o YouTube não é uma plataforma de hospedagem de vídeo privada segura (DRM)**.

### O que NÃO é possível evitar:
1. **Link Direto**: Usuários com conhecimento técnico podem inspecionar o código da página e obter o ID do vídeo.
2. **Compartilhamento**: Se um usuário obtiver o link direto, ele poderá compartilhar com outras pessoas.
3. **Menu de Contexto**: Clicar com o botão direito no vídeo ainda pode mostrar a opção "Copiar URL do vídeo".

## 🔒 Recomendações para Maior Segurança

Para cursos que exigem proteção rigorosa de propriedade intelectual (DRM), recomendamos considerar migrar futuramente para plataformas dedicadas como:

- **Vimeo Pro/Business**: Permite restringir a reprodução apenas ao domínio `prospera.farm`.
- **Bunny.net Stream**: Solução de baixo custo com proteção contra download e hotlink.
- **Cloudflare Stream**: Hospedagem segura com tokens assinados.

## 🔄 Fluxo Atual (Custo Zero)

A solução atual é ideal para a fase de validação e crescimento inicial, pois:
1. **Custo Zero**: Hospedagem gratuita e ilimitada no YouTube.
2. **Vídeos Não Listados**: Os vídeos não aparecem na busca do YouTube nem no canal público.
3. **Experiência Limpa**: A interface remove a maioria das distrações visuais do YouTube.

Esta abordagem equilibra custo-benefício com uma experiência de usuário profissional, adequada para o estágio atual da Prospera Academy.
