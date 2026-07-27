# Plano operacional — ARMAF

## Escopo

Executar exclusivamente neste repositório: `carteiradesucesso-code/payments`.

É proibido ler, gravar, criar branch, commit, issue, PR ou arquivo em `carteiradesucesso-code/importtudo`.

## Fontes canônicas

1. `dados/armaf_catalogo_auditado.json`: identidade, preços, campos confirmados, descrições e fontes.
2. `dados/manifesto_imagens.json`: URLs e autorização de cada imagem.
3. `dados/pendencias.json`: bloqueios e campos que devem ser omitidos.

Não completar campos por memória, similaridade visual ou inferência.

## Estrutura a criar

```text
imagens/
├── autorizadas/
├── candidatas/
├── bloqueadas/
└── rejeitadas/
relatorios/
├── downloads.json
├── validacao_imagens.json
├── duplicidades.json
└── resumo_final.md
```

## Download

- Baixar para `imagens/autorizadas/` somente `estado_imagem=autorizada`.
- Itens `autorizada_com_validacao_de_embalagem` ou `autorizada_com_validacao_de_rotulo` devem ser baixados, mas permanecer marcados para revisão manual.
- Itens `candidata_nao_autorizada` podem ser baixados apenas em `imagens/candidatas/`, jamais usados no encarte.
- Itens `bloqueada` não devem receber substituição automática.
- Usar exatamente o campo `arquivo` do manifesto.
- Preservar a URL completa, incluindo query string.

## Validação obrigatória de cada arquivo

Registrar:

- URL solicitada e URL final após redirecionamentos;
- código HTTP;
- `Content-Type`;
- formato real detectado pelos bytes;
- largura, altura e proporção;
- tamanho em bytes;
- SHA-256;
- hash perceptual;
- presença de transparência;
- pasta de destino;
- decisão final e justificativa.

Rejeitar:

- HTML salvo como imagem;
- placeholder;
- banner de coleção;
- imagem contendo produto diferente;
- kit ou caixa não correspondente;
- arquivo corrompido;
- arquivo com maior lado inferior a 600 px, salvo justificativa explícita;
- imagem cuja variante, cor, volume ou rótulo contradiga o registro.

## Duplicidades

Comparar SHA-256 e hash perceptual. Imagens iguais só podem ser compartilhadas quando o produto e a apresentação visual forem comprovadamente os mesmos. Não compartilhar automaticamente imagens entre:

- Intense Man 105 ml EDT e Intense Man 200 ml EDP;
- variantes Club de Nuit;
- Femme, Femme Gold ou Femme White Edition;
- Spectra e Spectra Blue Edition;
- Mandarin Sky e suas edições;
- Candy/Candee e edições especiais.

## Nomes e publicação

Manter `nome_recebido` e `nome_oficial` separados. Não sobrescrever divergências. Para o encarte:

- `Black Florest` deve permanecer registrado como recebido, mas o nome oficial confirmado é `Odyssey Black Forest`.
- `Limone` deve permanecer registrado como recebido, mas o nome oficial confirmado é `Odyssey Limoni`.
- `Lion Heart` deve permanecer registrado como recebido, mas o nome oficial confirmado usa `Club de Nuit Lionheart`.
- `Mandarin Sky` deve permanecer registrado como recebido, mas o nome oficial confirmado é `Odyssey Mandarin Sky`.
- Itens bloqueados não podem ser publicados.

## Preços

Os preços são dados comerciais fornecidos pelo usuário e não devem ser alterados por pesquisa externa:

- conservar vírgula decimal;
- conservar `Consultar` sem converter para outro texto;
- não substituir por preços da Armaf, marketplaces ou conversão cambial.

## Campos conflitantes

Quando `publico`, `familia`, `volume` ou `concentracao` estiverem nulos, pendentes ou conflitantes, omitir o campo na arte. Não escolher uma versão por conveniência de layout.

## Saída final

Gerar `relatorios/resumo_final.md` contendo:

- 28 registros recebidos;
- quantidade de imagens autorizadas;
- candidatas;
- bloqueadas;
- downloads concluídos e falhos;
- arquivos rejeitados e motivos;
- duplicidades exatas e perceptuais;
- itens que ainda exigem foto, EAN ou definição de volume;
- confirmação textual de que o repositório `importtudo` não foi acessado nem alterado.

## Critério de conclusão

O trabalho só termina quando cada registro possuir uma destas decisões documentadas:

1. imagem validada e autorizada;
2. imagem candidata isolada e não publicável;
3. bloqueio explícito com evidência necessária para destravar.
