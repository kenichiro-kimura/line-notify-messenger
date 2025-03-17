export enum SendMode {
    broadcast = 'broadcast',
    group = 'group',
    all = 'all'
}

export interface ISendModeStrategy {
    getSendMode(): SendMode;
}
