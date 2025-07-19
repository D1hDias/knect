import { Page } from 'puppeteer';
import { wsConnections } from '../websocket';

export abstract class CertidaoAutomator {
  protected page: Page;
  protected dadosContexto: any;
  protected config: any;
  protected userId: number;

  constructor(page: Page, dadosContexto: any, config: any, userId: number) {
    this.page = page;
    this.dadosContexto = dadosContexto;
    this.config = config;
    this.userId = userId;
  }

  /**
   * Método principal que orquestra a automação.
   */
  abstract executarAutomacao(): Promise<{ success: boolean; protocol?: string; error?: string }>;

  /**
   * Lógica de preenchimento de formulários específica para o site.
   */
  abstract preencherFormularios(): Promise<void>;

  /**
   * Navega para a URL inicial e aguarda a página carregar.
   */
  protected async navegarParaPaginaInicial(): Promise<void> {
    console.log(`Navegando para: ${this.config.url}`);
    this.notificarStatus(`Navegando para: ${this.config.url}`);
    
    await this.page.goto(this.config.url, { waitUntil: 'networkidle2' });
    
    this.notificarStatus('Página carregada, verificando conteúdo...');
    
    // Log da página carregada para debug
    const pageInfo = await this.page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      hasBody: !!document.body,
      elementCount: document.querySelectorAll('*').length
    }));
    
    console.log('📋 Página carregada:', pageInfo);
    this.notificarStatus(`Página carregada: ${pageInfo.title} (${pageInfo.elementCount} elementos)`);
  }

  /**
   * Envia atualizações de status para o cliente via WebSocket.
   */
  protected notificarStatus(status: string, data?: any): void {
    const ws = wsConnections.get(this.userId);
    if (ws) {
      const payload = JSON.stringify({
        type: 'automation_update',
        certidaoId: this.config.id,
        status,
        log: data?.log || status, // Send the status as log if no specific log message
        payload: data
      });
      ws.send(payload);
      console.log(`[WS_SEND] Notified userId ${this.userId}: ${status}`);
    } else {
      console.log(`[WS_WARN] No active WebSocket connection found for userId ${this.userId}.`);
    }
  }
}
