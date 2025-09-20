type Listener = () => void;

export const LogLevels = ["debug", "info", "warning", "error"] as const;
export type LogLevel = typeof LogLevels[number];
export type LogStrings = Array<{ content: string, level: string }>

class Logger {
    private static _instance: Logger;
    private logs: LogStrings = [{ content: "[START]: This is the start of the log", level: "info" }];
    private listeners: Listener[] = [];

    private loglevel: LogLevel = "debug";

    private constructor() { }

    static get instance(): Logger {
        if (!Logger._instance) {
            Logger._instance = new Logger();
        }
        return Logger._instance;
    }

    log(level: LogLevel, text: string) {
        console.log("log called:", level, text);
        if (LogLevels.indexOf(this.loglevel) <= LogLevels.indexOf(level)) {
            console.log("Adding log entry", level, text);
            if (this.logs.push({ level: level, content: `[${level.toUpperCase()}]: ${text.substring(0, 55)}` }) > 100) {
                console.log("Log limit exceeded, removing oldest");
                this.logs.shift();
            }
            this.notify();
        } else {
            console.log(`Log level ${level} is too low for log:`, text);
        }
    }

    getLogs() {
        return [...this.logs];
    }

    subscribe(listener: Listener) {
        this.listeners.push(listener);
    }

    unsubscribe(listener: Listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    private notify() {
        this.listeners.forEach(l => l());
    }
}

// Export a single instance
export const logger = Logger.instance;
