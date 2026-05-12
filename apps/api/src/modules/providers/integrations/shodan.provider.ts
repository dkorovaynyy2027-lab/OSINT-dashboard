import { 
  BaseProvider, 
  ProviderMetadata, 
  ProviderRunContext, 
  ProviderRunResult,
} from '@osint/plugin-sdk';
import { EntityKind } from '@osint/types';
import axios from 'axios';

export class ShodanProvider extends BaseProvider {
  readonly meta: ProviderMetadata = {
    name: 'shodan',
    displayName: 'Shodan InternetDB',
    description: 'Quick lookup for open ports, vulnerabilities, and hostnames',
    supports: [EntityKind.IP],
    requiresApiKey: false, // InternetDB is free and doesn't require key, but main API does
    freeTier: 'Unlimited for InternetDB',
    homepage: 'https://internetdb.shodan.io/',
  };

  protected async query(ctx: ProviderRunContext): Promise<ProviderRunResult<any>> {
    const { value } = ctx;

    try {
      // Using Shodan InternetDB for fast, no-auth lookups
      const response = await axios.get(`https://internetdb.shodan.io/${value}`, {
        timeout: 5000,
      });

      const data = response.data;
      if (!data || data.ip !== value) return { data: null };

      const riskSignals = [];
      if (data.vulns?.length > 0) {
        riskSignals.push({
          type: 'vulnerabilities_detected',
          severity: 'HIGH' as const,
          score: Math.min(data.vulns.length * 2, 10),
          description: `Detected ${data.vulns.length} CVEs: ${data.vulns.slice(0, 5).join(', ')}`,
        });
      }

      if (data.ports?.length > 0) {
        riskSignals.push({
          type: 'open_ports',
          severity: 'INFO' as const,
          score: 1,
          description: `Open ports: ${data.ports.join(', ')}`,
        });
      }

      return {
        data,
        riskSignals,
        relatedEntities: data.hostnames?.map((h: string) => ({
          kind: EntityKind.DOMAIN,
          value: h,
          relation: 'resolves_to',
          confidence: 1.0,
        })),
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { data: null };
      }
      throw error;
    }
  }
}
