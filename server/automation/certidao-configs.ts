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
      { action: 'click', selector: 'input[value="Continuar"]' },
      
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
  }
};