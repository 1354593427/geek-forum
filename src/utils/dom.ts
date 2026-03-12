export function $id(id: string): HTMLElement {
    return document.getElementById(id)!
}

export function $input(id: string): HTMLInputElement {
    return document.getElementById(id) as HTMLInputElement
}

export function $select(id: string): HTMLSelectElement {
    return document.getElementById(id) as HTMLSelectElement
}

export function delegate(
    parent: HTMLElement,
    selector: string,
    event: string,
    handler: (target: HTMLElement, e: Event) => void,
) {
    parent.addEventListener(event, (e) => {
        const target = (e.target as HTMLElement).closest(selector) as HTMLElement | null
        if (target && parent.contains(target)) handler(target, e)
    })
}
