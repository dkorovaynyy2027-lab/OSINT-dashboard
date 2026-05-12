import { 
  BaseProvider, 
  ProviderMetadata, 
  ProviderRunContext, 
  ProviderRunResult,
} from '@osint/plugin-sdk';
import { EntityKind } from '@osint/types';
import { promises as dns } from 'dns';

export class DnsProvider extends BaseProvider {
  readonly meta: ProviderMetadata = {
    name: 'dns',
    displayName: 'DNS Lookup',
    description: 'Resolve A, AAAA, MX, TXT, and NS records',
    supports: [EntityKind.DOMAIN],
    requiresApiKey: false,
    freeTier: 'Unlimited',
    homepage: 'https://nodejs.org/api/dns.html',
  };

  protected async query(ctx: ProviderRunContext): Promise<ProviderRunResult<any>> {
    const { value } = ctx;

    try {
      const [a, mx, txt, ns] = await Promise.allSettled([
        dns.resolve4(value),
        dns.resolveMx(value),
        dns.resolveTxt(value),
        dns.resolveNs(value),
      ]);

      const data: any = {
        a: a.status === 'fulfilled' ? a.value : [],
        mx: mx.status === 'fulfilled' ? mx.value : [],
        txt: txt.status === 'fulfilled' ? txt.value : [],
        ns: ns.status === 'fulfilled' ? ns.value : [],
      };

      const relatedEntities = [];

      // Add IP addresses from A records
      if (Array.isArray(data.a)) {
        for (const ip of data.a) {
          relatedEntities.push({
            kind: EntityKind.IP,
            value: ip,
            relation: 'resolves_to',
            confidence: 1.0,
          });
        }
      }

      // Add mail servers from MX records
      if (Array.isArray(data.mx)) {
        for (const mail of data.mx) {
          relatedEntities.push({
            kind: EntityKind.DOMAIN,
            value: mail.exchange,
            relation: 'mail_server',
            confidence: 0.9,
          });
        }
      }

      return {
        data,
        relatedEntities,
      };
    } catch (error) {
      throw error;
    }
  }
}
