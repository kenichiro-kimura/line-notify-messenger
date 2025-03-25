export interface ITokenSourceProvider {
    getEnvValue(key: string): string | undefined;
    getEnvKeys(): string[];
}