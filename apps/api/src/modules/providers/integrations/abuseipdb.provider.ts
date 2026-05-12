import { 
  BaseProvider, 
  ProviderMetadata, 
  ProviderRunContext, 
  ProviderRunResult,
} from '@osint/plugin-sdk';
import { EntityKind } from '@osint/types';
import axios from 'axios';

export class AbuseIpDbProvider extends BaseProvider {
  readonly meta: ProviderMetadata = {
    name: 'abuseipdb',
    displayName: 'AbuseIPDB',
    description: 'IP reputation and abuse reporting',
    supports: [EntityKind.IP],
    requiresApiKey: true,
    freeTier: '1000 requests/day',
    homepage: 'https://www.abuseipdb.com/',
  };

  protected async query(ctx: ProviderRunContext): Promise<ProviderRunResult<any>> {
    const { value, apiKey } = ctx;
    if (!apiKey) throw new Error('AbuseIPDB API key is required');

    try {
      const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
        headers: { 
          'Key': apiKey,
          'Accept': 'application/json'
        },
        params: {
          ipAddress: value,
          maxAgeInDays: 90,
          verbose: true
        },
        timeout: 5000,
      });

      const data = response.data?.data;
      if (!data) return { data: null };

      const score = data.abuseConfidenceScore || 0;
      const riskSignals = [];
      
      if (score > 0) {
        riskSignals.push({
          type: 'abuse_confidence',
          severity: (score > 75 ? 'CRITICAL' : score > 40 ? 'HIGH' : score > 10 ? 'MEDIUM' : 'LOW') as any,
          score: score / 10,
          description: `Abuse confidence score: ${score}% (${data.totalReports} reports)`,
        });
      }

      return {
        data,
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
