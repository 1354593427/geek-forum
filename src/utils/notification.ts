export function showNotification(msg: string, duration = 4000): void {
    const el = document.createElement('div')
    el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] font-black text-xs uppercase tracking-widest animate-bounce'
    el.innerHTML = `🛠️ ${msg}`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), duration)
}
