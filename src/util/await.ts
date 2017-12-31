export function event(target: EventTarget, event: string, filter?: (ev: any) => boolean) {
    return new Promise(accept => {
        const listener = (ev: any) => {
            if (filter === undefined || filter(ev)) {
                target.removeEventListener(event, listener);
                accept(ev);
            }
        };
        target.addEventListener(event, listener);
    });
}

export function script(src: string | string[]): Promise<any> {
    if (src instanceof Array) {
        return Promise.all(src.map(singleSrc => script(singleSrc)));
    }
    
    const scriptElement = document.createElement('script');
    const promise = event(scriptElement, 'load');

    scriptElement.type  = 'text/javascript';
    scriptElement.async = true;
    scriptElement.src   = src;

    document.body.appendChild(scriptElement);

    return promise;
}