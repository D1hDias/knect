export interface CertidaoStep {
  action: 'click' | 'fill' | 'select' | 'wait_element' | 'captcha_pause' | 'extract_protocol' | 'select_by_city' | 'toast_message';
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
      // 1. Começar na página de seleção de comarcas (já vamos direto aqui)
      { action: 'toast_message', selector: 'body', message: 'Estamos na página de seleção de Comarca...' },
      
      // 2. Escolher comarca baseada na cidade do imóvel (links clicáveis)
      { action: 'toast_message', selector: 'body', message: 'Estamos escolhendo a Comarca exata...' },
      { action: 'wait_element', selector: '.bordasModelos' },
      { action: 'select_by_city', selector: '.bordasModelos', value_from: 'imovel.city' },
      
      // 3. Escolher "Fazendárias"
      { action: 'toast_message', selector: 'body', message: 'Escolhida a opção Fazendárias.' },
      { action: 'wait_element', selector: 'input[value="Fazendárias"]' },
      { action: 'click', selector: 'input[value="Fazendárias"]' },
      
      // 4. Escolher "Imóveis"
      { action: 'toast_message', selector: 'body', message: 'Escolhida a opção Imóveis.' },
      { action: 'wait_element', selector: 'input[value="Imóveis"]' },
      { action: 'click', selector: 'input[value="Imóveis"]' },
      
      // 5. Preencher dados do requerente (usuário logado)
      { action: 'toast_message', selector: 'body', message: 'Preenchendo dados do Requerente...' },
      { action: 'wait_element', selector: 'input[name="nome"]' },
      { action: 'fill', selector: 'input[name="nome"]', value_from: 'usuario.fullName' },
      { action: 'fill', selector: 'input[name="cpf"]', value_from: 'usuario.cpf' },
      { action: 'fill', selector: 'input[name="email"]', value_from: 'usuario.email' },
      { action: 'fill', selector: 'input[name="telefone"]', value_from: 'usuario.phone' },
      { action: 'click', selector: 'input[value="Continuar"]' },
      
      // 6. Preencher dados do imóvel
      { action: 'toast_message', selector: 'body', message: 'Preenchendo dados do imóvel...' },
      { action: 'wait_element', selector: 'input[name="inscricao"]' },
      { action: 'fill', selector: 'input[name="inscricao"]', value_from: 'imovel.municipalRegistration' },
      { action: 'fill', selector: 'input[name="rua"]', value_from: 'imovel.street' },
      { action: 'fill', selector: 'input[name="numero"]', value_from: 'imovel.number' },
      { action: 'fill', selector: 'input[name="complemento"]', value_from: 'imovel.complement' },
      { action: 'fill', selector: 'input[name="bairro"]', value_from: 'imovel.neighborhood' },
      { action: 'click', selector: 'input[value="Continuar"]' },
      
      // 7. Escolher "compra e venda" (opção 14)
      { action: 'wait_element', selector: 'select[name="finalidade"]' },
      { action: 'select', selector: 'select[name="finalidade"]', value: '14' },
      { action: 'click', selector: 'input[value="Continuar"]' },
      
      // 8. Pausa para CAPTCHA
      { action: 'captcha_pause', selector: 'body', message: 'Aguardando resolução do CAPTCHA pelo usuário...' }
    ]
  }
};
