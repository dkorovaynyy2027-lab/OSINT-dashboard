import { 
  BaseProvider, 
  ProviderMetadata, 
  ProviderRunContext, 
  ProviderRunResult,
} from '@osint/plugin-sdk';
import { EntityKind } from '@osint/types';
import axios from 'axios';

export class HibpProvider extends BaseProvider {
  readonly meta: ProviderMetadata = {
    name: 'hibp',
    displayName: 'Have I Been Pwned',
    description: 'Check if an email address has been compromised in data breaches',
    supports: [EntityKind.EMAIL],
    requiresApiKey: true,
    freeTier: 'Paid API key required',
    homepage: 'https://haveibeenpwned.com/API/Key',
  };

  protected async query(ctx: ProviderRunContext): Promise<ProviderRunResult<any>> {
    const { value, apiKey } = ctx;
    if (!apiKey) throw new Error('HIBP API key is required');

    try {
      const response = await axios.get(`https://haveibeenpwned.com/api/v3/breachedaccount/${value}`, {
        headers: { 
          'hibp-api-key': apiKey,
          'user-agent': 'OSINT-Platform-Intelligence-App'
        },
        params: { truncateResponse: false },
        timeout: 5000,
      });

      const breaches = response.data;
      if (!breaches || breaches.length === 0) return { data: null };

      const riskSignals = [];
      const criticalBreaches = breaches.filter((b: any) => b.IsSensitive || b.PwnCount > 10000000);
      
      if (breaches.length > 0) {
        riskSignals.push({
          type: 'email_compromised',
          severity: criticalBreaches.length > 0 ? 'CRITICAL' : breaches.length > 3 ? 'HIGH' : 'MEDIUM' as any,
          score: Math.min(breaches.length * 2, 10),
          description: `Email found in ${breaches.length} breaches. Examples: ${breaches.slice(0, 3).map((b: any) => b.Name).join(', ')}`,
        });
      }

      return {
        data: breaches,
        riskSignals,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) return { data: null };
        if (error.response?.status === 429) throw new Error('HIBP Rate limit exceeded');
      }
      throw error;
    }
  }
}
