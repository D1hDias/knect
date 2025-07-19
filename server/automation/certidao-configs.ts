export interface CertidaoStep {
  action: 'click' | 'fill' | 'select' | 'wait_element' | 'captcha_pause' | 'captcha_modal' | 'extract_protocol' | 'select_by_city' | 'select_by_text' | 'toast_message';
  selector: string;
  type?: 'css' | 'xpath';
  value_from?: string; // e.g., 'proprietario.nome_completo'
  value?: string; // For static values
  message?: string; // For toast messages
}

export interface CertidaoConfig {
  id: string;
  name: string;
  url: string;
  site_type: string;
  automation_class: string;
  required_data: string[];
  steps: CertidaoStep[];
}

export const CERTIDAO_CONFIGS: Record<string, CertidaoConfig> = {
  onus_reais: {
    id: 'onus_reais',
    name: 'ÔNUS REAIS',
    url: 'https://ridigital.org.br/CertidaoDigital/frmPedidosCertidao.aspx?from=menu&digital=1',
    site_type: 'ridigital',
    automation_class: 'RiDigitalAutomator',
    required_data: ['proprietario', 'imovel'],
    steps: [
      { action: 'wait_element', selector: '#radix-\\:r2r\\: > div.space-y-6 > div:nth-child(2) > div.p-6.pt-0 > div > div:nth-child(2)' },
      { action: 'click', selector: '#radix-\\:r2r\\: > div.space-y-6 > div:nth-child(2) > div.p-6.pt-0 > div > div:nth-child(2)' },
      { action: 'wait_element', selector: 'input[name="nome"]' },
      { action: 'fill', selector: 'input[name="nome"]', value_from: 'proprietario.fullName' },
      { action: 'fill', selector: 'input[name="cpf"]', value_from: 'proprietario.cpf' },
      { action: 'captcha_pause', selector: 'body', value: 'Aguardando resolução do CAPTCHA pelo usuário...' }
    ]
  },
  certidao_fazendaria: {
    id: 'certidao_fazendaria',
    name: 'Certidão Fazendária',
    url: 'https://www3.tjrj.jus.br/CJE/certidao/judicial/selecionarComarcas',
    site_type: 'tjrj',
    automation_class: 'TJRJAutomator',
    required_data: ['usuario', 'proprietario', 'imovel'],
    steps: [
      // NOVA CONFIGURAÇÃO CORRIGIDA - SEM REFERENCIAS ANTIGAS
      { action: 'toast_message', selector: 'body', message: 'Estamos na página de seleção de Comarca...' },
      { action: 'wait_element', selector: '.bordasModelos' },
      { action: 'select_by_city', selector: '.bordasModelos', value_from: 'imovel.city' },
      
      // Depois da seleção da comarca, iremos para a próxima página
      { action: 'toast_message', selector: 'body', message: 'Comarca selecionada, prosseguindo...' },
      { action: 'wait_element', selector: '#myForm3' },
      { action: 'click', selector: '#myForm3 .bordasModelos' },
      
      { action: 'toast_message', selector: 'body', message: 'Escolhida a opção Fazendárias. Aguardando página carregar...' },
      
      // Aguardar a página de seleção de tipo carregar e procurar "Imóveis"
      { action: 'wait_element', selector: '.bordasModelos' },
      { action: 'toast_message', selector: 'body', message: 'Página carregada. Procurando opção Imóveis...' },
      
      // Clicar em "Imóveis" - usar ação customizada para encontrar pelo texto
      { action: 'select_by_text', selector: '.bordasModelos', value: 'Imóveis' },
      { action: 'toast_message', selector: 'body', message: 'Clicado em Imóveis. Aguardando próxima página...' },
      
      // ETAPA: Preencher Dados do Requerente (usuário logado)
      { action: 'toast_message', selector: 'body', message: 'Aguardando formulário de dados do Requerente carregar...' },
      
      // Aguardar formulário de dados do requerente (usar ID específico)
      { action: 'wait_element', selector: '#nomerequerente' },
      { action: 'toast_message', selector: 'body', message: 'Formulário encontrado! Preenchendo dados do Requerente...' },
      
      // Preencher campos do requerente com seletores corretos
      { action: 'fill', selector: '#nomerequerente', value_from: 'usuario.fullName' },
      { action: 'fill', selector: '#cpfcnpj2', value_from: 'usuario.cpf' },
      { action: 'fill', selector: '#email', value_from: 'usuario.email' },
      { action: 'fill', selector: '#telefone', value_from: 'usuario.phone' },
      
      { action: 'toast_message', selector: 'body', message: 'Dados do requerente preenchidos. Clicando em Continuar...' },
      { action: 'click', selector: 'inpEsta etapa inclusive, é exatamente idêntica a mesma etapa utilizada na automação anterior de Id certidao_fazendaria. Após o preenchimento, clicar sobre o botão de value Continuar. ut[value="Continuar"]' },
      
      // ETAPA: Preencher Dados para Pesquisa (dados do imóvel)
      { action: 'toast_message', selector: 'body', message: 'Aguardando formulário de Dados para Pesquisa carregar...' },
      
      // Aguardar formulário de dados do imóvel
      { action: 'wait_element', selector: '#NumeroInscricao' },
      { action: 'toast_message', selector: 'body', message: 'Formulário de dados do imóvel encontrado! Preenchendo...' },
      
      // Preencher campos do imóvel com dados da propriedade
      { action: 'fill', selector: '#NumeroInscricao', value_from: 'imovel.municipalRegistration' },
      { action: 'fill', selector: '#Endereco', value_from: 'imovel.street' },
      { action: 'fill', selector: '#Numero', value_from: 'imovel.number' },
      { action: 'fill', selector: '#Complemento', value_from: 'imovel.complement' },
      { action: 'fill', selector: '#Bairro', value_from: 'imovel.neighborhood' },
      
      { action: 'toast_message', selector: 'body', message: 'Dados do imóvel preenchidos. Clicando em Continuar...' },
      { action: 'click', selector: 'input[value="Continuar"]' },
      
      // ETAPA: Selecionar Finalidade (Compra e Venda)
      { action: 'toast_message', selector: 'body', message: 'Aguardando seleção de finalidade carregar...' },
      
      // Aguardar dropdown de finalidade
      { action: 'wait_element', selector: '#FinalidadeCombo' },
      { action: 'toast_message', selector: 'body', message: 'Selecionando finalidade: Compra e Venda...' },
      
      // Selecionar "Compra e Venda" (value="176")
      { action: 'select', selector: '#FinalidadeCombo', value: '176' },
      
      { action: 'toast_message', selector: 'body', message: 'Finalidade selecionada. Procurando botão Confirmar...' },
      
      // Botão "Continuar" correto
      { action: 'wait_element', selector: 'button.btn.btn-primary[onclick="validar();"]' },
      { action: 'click', selector: 'button.btn.btn-primary[onclick="validar();"]' },
      
      // ETAPA FINAL: CAPTCHA - Pausa para resolução manual
      { action: 'toast_message', selector: 'body', message: 'Aguardando CAPTCHA aparecer...' },
      { action: 'captcha_modal', selector: 'body', message: 'RESOLVA O CAPTCHA: Por favor, resolva o CAPTCHA que apareceu na tela e clique em "Continuar" quando terminar.' }
    ]
  },
  segundo_distribuidor: {
    id: 'segundo_distribuidor',
    name: '2º Distribuidor - Pessoais (Vendedor)',
    url: 'https://www3.tjrj.jus.br/CJE/',
    site_type: 'tjrj',
    automation_class: 'TJRJAutomator',
    required_data: ['usuario', 'proprietario', 'imovel'],
    steps: [
      // Etapa 1: Clicar na imagem específica do Solicitar
      { action: 'toast_message', selector: 'body', message: '🔄 Etapa 1/10: Clicando em Nova Certidão...' },
      { action: 'wait_element', selector: 'img[src="/CJE/Areas/certidao/images/icoNovaCert.png"]' },
      { action: 'click', selector: 'img[src="/CJE/Areas/certidao/images/icoNovaCert.png"]' },
      
      // Etapa 2: Selecionar comarca (igual ao certidao_fazendaria)
      { action: 'toast_message', selector: 'body', message: '🔄 Etapa 2/10: Selecionando comarca...' },
      { action: 'wait_element', selector: '.bordasModelos' },
      { action: 'select_by_city', selector: '.bordasModelos', value_from: 'imovel.city' },
      
      // Etapa 3: Após seleção da comarca, clicar no elemento Ações Cíveis
      { action: 'toast_message', selector: 'body', message: '🔄 Etapa 3/10: Acessando Ações Cíveis...' },
      { action: 'wait_element', selector: '#myForm1' },
      { action: 'click', selector: '#myForm1 .bordasModelos' },
      
      // Etapa 4: Preencher campos do usuário logado em REQUERIMENTO DE CERTIDÃO ELETRÔNICA
      { action: 'toast_message', selector: 'body', message: '🔄 Etapa 4/10: Preenchendo dados do requerente...' },
      { action: 'wait_element', selector: '#nomerequerente' },
      { action: 'fill', selector: '#nomerequerente', value_from: 'usuario.fullName' },
      { action: 'fill', selector: '#cpfcnpj2', value_from: 'usuario.cpf' },
      { action: 'fill', selector: '#email', value_from: 'usuario.email' },
      { action: 'fill', selector: '#telefone', value_from: 'usuario.phone' },
      
      // Etapa 5: Clicar no botão Continuar/Confirmar para submeter o formulário
      { action: 'toast_message', selector: 'body', message: '🔄 Etapa 5/10: Avançando para dados do proprietário...' },
      { action: 'click', selector: 'input[value="Continuar"]' },
      
      // Etapa 6: Preencher dados do proprietário em "Dados para pesquisa"
      { action: 'toast_message', selector: 'body', message: '🔄 Etapa 6/10: Preenchendo dados do proprietário...' },
      { action: 'wait_element', selector: '#nomerequerido' },
      { action: 'fill', selector: '#nomerequerido', value_from: 'proprietario.fullName' },
      { action: 'fill', selector: '#cpfcnpj', value_from: 'proprietario.cpf' },
      { action: 'fill', selector: '#DN', value_from: 'proprietario.birthDate' },
      { action: 'fill', selector: '#txtMae', value_from: 'proprietario.motherName' },
      { action: 'fill', selector: '#txtPai', value_from: 'proprietario.fatherName' },
      
      // Etapa 7: Clicar em Continuar após preencher dados do proprietário
      { action: 'toast_message', selector: 'body', message: '🔄 Etapa 7/10: Avançando para seleção de finalidade...' },
      { action: 'click', selector: 'input[value="Continuar"]' },
      
      // Etapa 8: Selecionar finalidade "Compra e Venda" (value 176)
      { action: 'toast_message', selector: 'body', message: '🔄 Etapa 8/10: Selecionando finalidade "Compra e Venda"...' },
      { action: 'wait_element', selector: '#FinalidadeCombo' },
      { action: 'select', selector: '#FinalidadeCombo', value: '176' },
      
      // Etapa 9: Clicar no botão Confirmar para avançar
      { action: 'toast_message', selector: 'body', message: '🔄 Etapa 9/10: Confirmando solicitação...' },
      { action: 'wait_element', selector: 'button.btn.btn-primary[onclick="validar();"]' },
      { action: 'click', selector: 'button.btn.btn-primary[onclick="validar();"]' },
      
      // Etapa 10: Abrir popup modal para interação do usuário com CAPTCHA
      { action: 'toast_message', selector: 'body', message: '🤖 Etapa 10/10: Aguardando resolução do CAPTCHA...' },
      { action: 'captcha_modal', selector: 'body', message: 'RESOLVA O CAPTCHA: Por favor, resolva o CAPTCHA que apareceu na tela e clique em "Continuar" quando terminar.' }
    ]
  }
};