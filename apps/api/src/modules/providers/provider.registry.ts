import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseProvider } from '@osint/plugin-sdk';
import { ShodanProvider } from './integrations/shodan.provider';
import { HibpProvider } from './integrations/hibp.provider';
import { VirusTotalProvider } from './integrations/virustotal.provider';
import { AbuseIpDbProvider } from './integrations/abuseipdb.provider';
import { WhoisProvider } from './integrations/whois.provider';
import { DnsProvider } from './integrations/dns.provider';
import { EntityKind } from '@osint/types';

@Injectable()
export class ProviderRegistry implements OnModuleInit {
  private providers: Map<string, BaseProvider> = new Map();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.register(new ShodanProvider({
      apiKey: this.configService.get('SHODAN_API_KEY'),
    }));
    this.register(new HibpProvider({
      apiKey: this.configService.get('HIBP_API_KEY'),
    }));
    this.register(new VirusTotalProvider({
      apiKey: this.configService.get('VIRUSTOTAL_API_KEY'),
    }));
    this.register(new AbuseIpDbProvider({
      apiKey: this.configService.get('ABUSEIPDB_API_KEY'),
    }));
    this.register(new WhoisProvider());
    this.register(new DnsProvider());
  }

  private register(provider: BaseProvider) {
    this.providers.set(provider.meta.name, provider);
  }

  getProvidersForEntity(kind: EntityKind): BaseProvider[] {
    return Array.from(this.providers.values()).filter(
      p => p.isEnabled() && p.supports(kind)
    );
  }

  getProvider(name: string): BaseProvider | undefined {
    return this.providers.get(name);
  }

  getAll(): BaseProvider[] {
    return Array.from(this.providers.values());
  }
}
