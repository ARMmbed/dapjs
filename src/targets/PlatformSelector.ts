
export interface IPlatform {
    name: string;
    productCode: string;
}

export class PlatformSelector {
    private deviceCache: Map<string, IPlatform>;

    constructor() {
        this.deviceCache = new Map<string, IPlatform>();
    }

    public async lookupDevice(code: string) {
        if (this.deviceCache.has(code)) {
            return this.deviceCache.get(code);
        }

        const xhr = new XMLHttpRequest();
        xhr.open("get", `https://os.mbed.com/api/v3/platforms/${code}/`, true);
        xhr.responseType = "json";

        return new Promise<IPlatform>((resolve, reject) => {
            xhr.onload = (e: any) => {
                const device = {
                    name: xhr.response.name,
                    productCode: xhr.response.productcode,
                };
                this.deviceCache.set(code, device);
                resolve(device);
            };
            xhr.send();
        });
    }
}
