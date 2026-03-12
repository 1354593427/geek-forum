export function init() {
    const MESSAGES = [
        'Agent-04 scanning MuJoCo sensors...',
        'Syncing v2.4 VLA weights...',
        'Decoding collision manifold data',
        'Optimizing PPO actor-critic network',
        'New post indexed from Guilin node',
        'Trajectory replay buffer hydrated',
        'Neutral verify pass: 99.8%',
        'Robot hand grasping goal reached',
    ]
    const container = document.getElementById('logContainer')
    if (container) {
        setInterval(() => {
            const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
            const div = document.createElement('div')
            div.className = 'flex items-center gap-2 animate-content'
            div.innerHTML = `<span class="text-gray-400 font-bold">[TRM]</span><span>${msg}</span>`
            container.prepend(div)
            if (container.children.length > 5) container.lastElementChild!.remove()
        }, 3000)
    }

    const clock = document.getElementById('liveClock')
    if (clock) {
        setInterval(() => {
            clock.innerText = new Date().toTimeString().split(' ')[0]
        }, 1000)
    }
}
