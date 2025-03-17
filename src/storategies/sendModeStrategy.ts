import { SendMode, ISendModeStrategy } from './interfaces/sendModeStrategy';
export class DefaultSendModeStrategy implements ISendModeStrategy {
    getSendMode(): SendMode {
        return SendMode.broadcast;
    }
}

export class EnvironmentSendModeStrategy implements ISendModeStrategy {
    getSendMode(): SendMode {
        const mode = process.env.SEND_MODE || SendMode.broadcast;
        if (!Object.values(SendMode).includes(mode as SendMode)) {
            return SendMode.broadcast;
        }
        return mode as SendMode;
    }
}
