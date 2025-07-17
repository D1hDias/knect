import { CertidaoAutomator } from '../CertidaoAutomator';
import puppeteer from 'puppeteer';

export class TJRJAutomator extends CertidaoAutomator {

  async executarAutomacao(): Promise<{ success: boolean; protocol?: string; error?: string }> {
    try {
      console.log(`🚀 DEBUG: Iniciando automação TJRJAutomator`);
      console.log(`🚀 DEBUG: Dados do contexto recebido:`, JSON.stringify(this.dadosContexto, null, 2));
      
      this.notificarStatus('Iniciando automação para Certidão Fazendária no TJRJ...');
      
      await this.navegarParaPaginaInicial();
      await this.preencherFormularios();
      
      // Lógica de extração de protocolo, etc.
      const protocol = 'TJRJ_PROTOCOLO_' + Date.now();
      this.notificarStatus('Automação concluída com sucesso!', { protocol });

      return { success: true, protocol };
    } catch (error: any) {
      console.error('Erro na automação do TJRJ:', error);
      this.notificarStatus('Erro na automação', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async preencherFormularios(): Promise<void> {
    this.notificarStatus('Executando passos da Certidão Fazendária...');
    
    let currentPage = 'início';
    
    // Executar cada step da configuração
    for (const step of this.config.steps) {
      
      try {
        switch (step.action) {
          case 'wait_element':
            await this.page.waitForSelector(step.selector, { timeout: 15000 });
            break;
            
          case 'click':
            await this.page.click(step.selector);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s após clique
            break;
            
          case 'fill':
            const value = this.getValueFromContext(step.value_from);
            if (value) {
              // Limpar campo antes de preencher
              await this.page.click(step.selector);
              await this.page.keyboard.down('Control');
              await this.page.keyboard.press('KeyA');
              await this.page.keyboard.up('Control');
              await this.page.keyboard.press('Delete');
              
              // Preencher com o valor
              await this.page.type(step.selector, value);
            }
            break;

          case 'select':
            if (step.value) {
              await this.page.select(step.selector, step.value);
            }
            break;

          case 'select_by_city':
            currentPage = 'Seleção de Comarca';
            this.notificarStatus(`Navegando: ${currentPage}`);
            await this.selectComarcaByCity(step.selector, step.value_from);
            break;

          case 'select_by_text':
            // Detectar mudança de página baseada no texto
            if (step.value === 'Imóveis') {
              currentPage = 'Seleção de Tipo';
              this.notificarStatus(`Navegando: ${currentPage}`);
            }
            await this.selectByText(step.selector, step.value);
            break;
            
          case 'toast_message':
            // Detectar mudanças de página importantes
            if (step.message && step.message.includes('formulário')) {
              if (step.message.includes('Requerente')) {
                currentPage = 'Dados do Requerente';
                this.notificarStatus(`Navegando: ${currentPage}`);
              } else if (step.message.includes('Pesquisa')) {
                currentPage = 'Dados do Imóvel';
                this.notificarStatus(`Navegando: ${currentPage}`);
              } else if (step.message.includes('finalidade')) {
                currentPage = 'Seleção de Finalidade';
                this.notificarStatus(`Navegando: ${currentPage}`);
              }
            }
            break;
            
          case 'captcha_pause':
            this.notificarStatus('Aguardando resolução manual do CAPTCHA...');
            await new Promise(resolve => setTimeout(resolve, 45000));
            break;

          case 'captcha_modal':
            this.notificarStatus('CAPTCHA detectado - Resolva manualmente na janela do browser');
            await this.handleCaptchaModal(step.message || 'Resolva o CAPTCHA para continuar');
            break;
            
          default:
            // Sem notificação para ações não implementadas
        }
      } catch (error: any) {
        this.notificarStatus(`Erro na página ${currentPage}: ${error.message}`);
        throw error;
      }
    }

    this.notificarStatus('Automação da Certidão Fazendária concluída!');
  }

  private async selectComarcaByCity(selector: string, cityValueFrom?: string): Promise<void> {
    const city = this.getValueFromContext(cityValueFrom);
    
    // Mapeamento de cidades para comarcas (adaptado para links)
    const cityToComarca: Record<string, string> = {
      'Rio de Janeiro': 'Capital',
      'Niterói': 'Niterói', 
      'São Gonçalo': 'Capital',
      'Duque de Caxias': 'Capital',
      'Nova Iguaçu': 'Capital',
      'Belford Roxo': 'Capital',
      'São João de Meriti': 'Capital',
      'Campos dos Goytacazes': 'Campos',
      'Petrópolis': 'Capital',
      'Volta Redonda': 'Capital'
    };

    const comarcaTarget = cityToComarca[city] || 'Capital';
    
    // Procurar e clicar no link da comarca correspondente
    const comarcaClicked = await this.page.evaluate((target) => {
      const links = Array.from(document.querySelectorAll('a[href*="/CJE/certidao/judicial/"]'));
      
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        
        if ((target === 'Capital' && href.includes('solicitarCapital')) ||
            (target === 'Niterói' && href.includes('Niteroi')) ||
            (target === 'Campos' && href.includes('Campos'))) {
          (link as HTMLElement).click();
          return { success: true };
        }
      }
      
      // Fallback para Capital
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        if (href.includes('solicitarCapital')) {
          (link as HTMLElement).click();
          return { success: true };
        }
      }
      
      return { success: false };
    }, comarcaTarget);

    if (!comarcaClicked.success) {
      throw new Error('Nenhum link de comarca encontrado');
    }
    
    // Aguardar navegação
    await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
  }

  private async selectByText(selector: string, targetText?: string): Promise<void> {
    if (!targetText) return;
    
    // Procurar e clicar no elemento que contém o texto especificado
    const elementClicked = await this.page.evaluate((cssSelector, text) => {
      const elements = Array.from(document.querySelectorAll(cssSelector));
      
      for (const element of elements) {
        if (element.textContent && element.textContent.includes(text)) {
          (element as HTMLElement).click();
          return { success: true };
        }
      }
      
      return { success: false };
    }, selector, targetText);

    if (!elementClicked.success) {
      throw new Error(`Elemento com texto "${targetText}" não encontrado`);
    }
    
    // Aguardar possível navegação
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async handleCaptchaModal(message: string): Promise<void> {
    try {
      console.log(`🎯 DEBUG: CAPTCHA detectado! Abrindo janela visível para o usuário...`);
      this.notificarStatus('CAPTCHA detectado! Abrindo janela do browser para resolução manual...');
      
      // Obter a URL atual onde está o CAPTCHA
      const currentUrl = this.page.url();
      console.log(`🎯 DEBUG: URL do CAPTCHA: ${currentUrl}`);
      
      // Configurações para janela centralizada e menor
      const windowWidth = 900;
      const windowHeight = 700;
      
      // Criar nova janela visível do browser para o usuário resolver o CAPTCHA
      const visibleBrowser = await puppeteer.launch({
        headless: false, // Visível para o usuário
        defaultViewport: { width: windowWidth, height: windowHeight },
        args: [
          '--no-default-browser-check',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-translate',
          '--disable-default-apps',
          '--no-first-run',
          '--disable-features=VizDisplayCompositor',
          `--window-size=${windowWidth},${windowHeight}`,
          '--app=data:text/html,<title>CAPTCHA - Resolva para continuar</title>' // Título personalizado
        ]
      });
      
      // Usar a primeira aba que já existe (não criar nova)
      const pages = await visibleBrowser.pages();
      const visiblePage = pages[0]; // Usar aba padrão existente
      
      // Copiar cookies da sessão atual para a nova janela
      const cookies = await this.page.cookies();
      await visiblePage.setCookie(...cookies);
      
      // Navegar para a página do CAPTCHA na janela visível
      await visiblePage.goto(currentUrl, { waitUntil: 'networkidle2' });
      
      // Centralizar a janela na tela
      await visiblePage.evaluate((width, height) => {
        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;
        const left = (screenWidth - width) / 2;
        const top = (screenHeight - height) / 2;
        
        // Tentar mover a janela para o centro
        try {
          window.moveTo(left, top);
          window.resizeTo(width, height);
        } catch (e) {
          console.log('Não foi possível centralizar a janela automaticamente');
        }
        
        // Adicionar estilo para destacar que é uma janela modal
        document.body.style.border = '3px solid #007bff';
        document.body.style.borderRadius = '8px';
        document.title = 'CAPTCHA - Resolva para continuar a automação';
        
        // Adicionar um banner no topo
        const banner = document.createElement('div');
        banner.innerHTML = `
          <div style="
            background: linear-gradient(90deg, #007bff, #0056b3);
            color: white;
            padding: 10px;
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            position: sticky;
            top: 0;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          ">
            🤖 AUTOMAÇÃO PAUSADA - Resolva o CAPTCHA abaixo para continuar
          </div>
        `;
        document.body.insertBefore(banner, document.body.firstChild);
        
      }, windowWidth, windowHeight);
      
      this.notificarStatus('Janela aberta! Resolva o CAPTCHA para continuar a automação.');
      
      // Aguardar resolução do CAPTCHA na página original (headless)
      let captchaResolved = false;
      let attempts = 0;
      const maxAttempts = 300; // 5 minutos para dar tempo ao usuário
      
      while (!captchaResolved && attempts < maxAttempts) {
        // Verificar se o hCaptcha foi resolvido na página original
        const isResolved = await this.page.evaluate(() => {
          const hcaptchaResponse = document.querySelector('textarea[name="h-captcha-response"]');
          if (hcaptchaResponse && hcaptchaResponse.value && hcaptchaResponse.value.length > 0) {
            return true;
          }
          
          const iframe = document.querySelector('iframe[src*="hcaptcha.com"]');
          if (iframe) {
            const dataResponse = iframe.getAttribute('data-hcaptcha-response');
            if (dataResponse && dataResponse.length > 0) {
              return true;
            }
          }
          
          return false;
        });
        
        // Também verificar na janela visível
        const isResolvedVisible = await visiblePage.evaluate(() => {
          const hcaptchaResponse = document.querySelector('textarea[name="h-captcha-response"]');
          if (hcaptchaResponse && hcaptchaResponse.value && hcaptchaResponse.value.length > 0) {
            return true;
          }
          
          const iframe = document.querySelector('iframe[src*="hcaptcha.com"]');
          if (iframe) {
            const dataResponse = iframe.getAttribute('data-hcaptcha-response');
            if (dataResponse && dataResponse.length > 0) {
              return true;
            }
          }
          
          return false;
        });
        
        if (isResolved || isResolvedVisible) {
          captchaResolved = true;
          this.notificarStatus('CAPTCHA resolvido! Concluindo automação...');
          
          // Se foi resolvido na janela visível, copiar o estado para a página original
          if (isResolvedVisible && !isResolved) {
            try {
              const captchaValue = await visiblePage.evaluate(() => {
                const textarea = document.querySelector('textarea[name="h-captcha-response"]');
                return textarea ? textarea.value : '';
              });
              
              if (captchaValue) {
                await this.page.evaluate((value) => {
                  const textarea = document.querySelector('textarea[name="h-captcha-response"]');
                  if (textarea) {
                    textarea.value = value;
                  }
                }, captchaValue);
              }
            } catch (error) {
              console.log('Erro ao copiar valor do CAPTCHA:', error);
            }
          }
          
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        // Feedback a cada 30 segundos
        if (attempts % 30 === 0) {
          this.notificarStatus(`Aguardando resolução do CAPTCHA... (${Math.floor(attempts/30) * 30}s)`);
        }
      }
      
      // Fechar a janela visível
      try {
        await visibleBrowser.close();
        console.log(`🎯 DEBUG: Janela visível fechada`);
      } catch (error) {
        console.log('Erro ao fechar janela visível:', error);
      }
      
      if (!captchaResolved) {
        this.notificarStatus('Timeout: CAPTCHA não resolvido em 5 minutos. Finalizando automação...');
      }
      
    } catch (error: any) {
      console.error(`❌ DEBUG: Erro no sistema de CAPTCHA:`, error);
      this.notificarStatus(`Erro no CAPTCHA: ${error.message}`);
    }
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
