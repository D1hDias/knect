import { CertidaoAutomator } from '../CertidaoAutomator';

export class RiDigitalAutomator extends CertidaoAutomator {
  async executarAutomacao(): Promise<{ success: boolean; protocol?: string; error?: string }> {
    try {
      this.notificarStatus('Iniciando automação para Ônus Reais no RI Digital...');
      await this.navegarParaPaginaInicial();
      await this.preencherFormularios();
      
      // Lógica de extração de protocolo, etc.
      const protocol = 'PROTOCOLO_EXEMPLO_123';
      this.notificarStatus('Automação concluída com sucesso!', { protocol });

      return { success: true, protocol };
    } catch (error: any) {
      console.error('Erro na automação do RI Digital:', error);
      this.notificarStatus('Erro na automação', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async preencherFormularios(): Promise<void> {
    this.notificarStatus('Preenchendo formulários...');
    
    // Executar cada step da configuração
    for (const step of this.config.steps) {
      this.notificarStatus(`Executando passo: ${step.action} em ${step.selector}`);
      
      try {
        switch (step.action) {
          case 'wait_element':
            await this.page.waitForSelector(step.selector, { timeout: 10000 });
            this.notificarStatus(`Elemento encontrado: ${step.selector}`);
            break;
            
          case 'click':
            await this.page.click(step.selector);
            this.notificarStatus(`Clicado em: ${step.selector}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s após clique
            break;
            
          case 'fill':
            const value = this.getValueFromContext(step.value_from);
            if (value) {
              await this.page.type(step.selector, value);
              this.notificarStatus(`Preenchido ${step.selector} com: ${value}`);
            } else {
              this.notificarStatus(`Valor não encontrado para: ${step.value_from}`);
            }
            break;
            
          case 'captcha_pause':
            this.notificarStatus('PAUSA PARA CAPTCHA - Resolva o captcha manualmente e a automação continuará em 30 segundos...');
            await new Promise(resolve => setTimeout(resolve, 30000)); // Pausa de 30 segundos para captcha
            break;
            
          default:
            this.notificarStatus(`Ação não implementada: ${step.action}`);
        }
      } catch (error: any) {
        this.notificarStatus(`Erro no passo ${step.action}: ${error.message}`);
        throw error;
      }
    }

    this.notificarStatus('Formulários preenchidos com sucesso!');
  }

  private getValueFromContext(valuePath?: string): string | null {
    if (!valuePath) return null;
    
    const keys = valuePath.split('.');
    let value: any = this.dadosContexto;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    
    return typeof value === 'string' ? value : String(value);
  }
}
