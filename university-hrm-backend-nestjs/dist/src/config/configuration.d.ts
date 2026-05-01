declare const _default: () => {
    port: number;
    frontendUrl: string;
    jwt: {
        secret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    smtp: {
        host: string;
        port: number;
        user: string;
        pass: string;
        from: string;
    };
    upload: {
        dir: string;
        maxFileSizeMb: number;
    };
    ai: {
        apiKey: string;
        model: string;
    };
    nodeEnv: string;
};
export default _default;
