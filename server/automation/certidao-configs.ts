export interface CertidaoStep {
  action: 'click' | 'fill' | 'select' | 'wait_element' | 'captcha_pause' | 'extract_protocol';
  selector: string;
  type?: 'css' | 'xpath';
  value_from?: string; // e.g., 'proprietario.nome_completo'
  value?: string; // For static values
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
    url: 'https://ridigital.org.br/CertidaoDigital/frmPedidosCertidao.aspx',
    site_type: 'ridigital',
    automation_class: 'RiDigitalAutomator',
    required_data: ['proprietario', 'imovel'],
    steps: [
      { action: 'click', selector: '#btnSolicitar' },
      { action: 'select', selector: '#comarca', value_from: 'proprietario.estado' },
      { action: 'fill', selector: '#nome', value_from: 'proprietario.nome_completo' },
    ]
  },
  certidao_fazendaria: {
    id: 'certidao_fazendaria',
    name: 'Certidão Fazendária',
    url: 'https://www3.tjrj.jus.br/CJE/certidao',
    site_type: 'tjrj',
    automation_class: 'TJRJAutomator',
    required_data: ['usuario', 'proprietario'],
    steps: [
      { action: 'click', selector: '//button[text()="Solicitar"]', type: 'xpath' },
    ]
  }
};
