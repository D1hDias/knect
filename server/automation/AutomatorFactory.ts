import { Page } from 'puppeteer';
import { CERTIDAO_CONFIGS } from './certidao-configs';
import { CertidaoAutomator } from './CertidaoAutomator';

// Importação das classes de automação
import { RiDigitalAutomator } from './automators/RiDigitalAutomator';
import { TJRJAutomator } from './automators/TJRJAutomator';

// Mapeamento das classes de automação
const automatorClasses: Record<string, any> = {
  RiDigitalAutomator,
  TJRJAutomator,
};

export class AutomatorFactory {
  static create(certidaoId: string, page: Page, dadosContexto: any, userId: number): CertidaoAutomator {
    const config = CERTIDAO_CONFIGS[certidaoId];
    if (!config) {
      throw new Error(`Configuração para a certidão '${certidaoId}' não encontrada.`);
    }

    const AutomatorClass = automatorClasses[config.automation_class];
    if (!AutomatorClass) {
      throw new Error(`Classe de automação '${config.automation_class}' não implementada ou registrada na factory.`);
    }

    return new AutomatorClass(page, dadosContexto, config, userId);
  }
}
