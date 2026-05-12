import { 
  BaseProvider, 
  ProviderMetadata, 
  ProviderRunContext, 
  ProviderRunResult,
} from '@osint/plugin-sdk';
import { EntityKind } from '@osint/types';
import axios from 'axios';

export class VirusTotalProvider extends BaseProvider {
  readonly meta: ProviderMetadata = {
    name: 'virustotal',
    displayName: 'VirusTotal',
    description: 'Malware analysis and domain/IP reputation',
    supports: [EntityKind.IP, EntityKind.DOMAIN, EntityKind.URL, EntityKind.HASH],
    requiresApiKey: true,
    freeTier: '4 requests/min, 500/day',
    homepage: 'https://www.virustotal.com/',
  };

  protected async query(ctx: ProviderRunContext): Promise<ProviderRunResult<any>> {
    const { entityKind, value, apiKey } = ctx;
    if (!apiKey) throw new Error('VirusTotal API key is required');

    let endpoint = '';
    switch (entityKind) {
      case EntityKind.IP: endpoint = `ip_addresses/${value}`; break;
      case EntityKind.DOMAIN: endpoint = `domains/${value}`; break;
      case EntityKind.URL: endpoint = `urls/${Buffer.from(value).toString('base64').replace(/=/g, '')}`; break;
      case EntityKind.HASH: endpoint = `files/${value}`; break;
      default: return { data: null };
    }

    try {
      const response = await axios.get(`https://www.virustotal.com/api/v3/${endpoint}`, {
        headers: { 'x-apikey': apiKey },
        timeout: 8000,
      });

      const attr = response.data?.data?.attributes;
      if (!attr) return { data: null };

      const stats = attr.last_analysis_stats || {};
      const malicious = stats.malicious || 0;
      
      const riskSignals = [];
      if (malicious > 0) {
        riskSignals.push({
          type: 'malicious_reputation',
          severity: (malicious > 5 ? 'CRITICAL' : malicious > 1 ? 'HIGH' : 'MEDIUM') as any,
          score: Math.min(malicious * 2, 10),
          description: `Flagged as malicious by ${malicious} engines`,
        });
      }

      return {
        data: attr,
        riskSignals,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { data: null };
      }
      throw error;
    }
  }
}
