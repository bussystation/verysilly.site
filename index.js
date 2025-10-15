function UKDate(dateString) {
    const options = { timeZone: "Europe/London", hour12: false }
    const parts = new Date(dateString).toLocaleString("en-GB", options).split(",")[0].split("/")
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
}

const birthDate = UKDate("2007-04-16")
const today = UKDate(new Date())

let age = today.getFullYear() - birthDate.getFullYear()
if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
    age--
}
document.querySelector('.age-count').textContent = age

function updateTime() {
    const now = new Date()
    const UKTime = now.toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour12: false })
    document.querySelector('.current-time').textContent = UKTime;
}
updateTime()
setInterval(updateTime, 1000);

async function updateWeather() {
    try {
        const weatherResponse = await fetch("https://api.open-meteo.com/v1/forecast?latitude=56.55265917553792&longitude=-2.5917211152983444&current=temperature_2m&timezone=Europe/London")
        const weatherData = await weatherResponse.json()
        const temp = Math.round(weatherData.current.temperature_2m)
        document.querySelector('.current-weather').textContent = `${temp}°C`
    } catch (error) {
        console.error('Error fetching weather:', error);
    }
}
updateWeather()
setInterval(updateWeather, 300000);

(async () => {
    const response = await fetch('https://silly.possiblyaxolotl.com/ring/webstring.js')
    const text = await response.text()
    
    const sitesMatch = text.match(/sites:\s*(\[[\s\S]*?\]),/)
    if (!sitesMatch) return
    const sites = JSON.parse(sitesMatch[1].replace(/,\s*\]/, "]"))
    
    const currentIndex = sites.findIndex(s => s.startsWith("https://verysilly.site"))
    
    if (currentIndex === -1) {
        console.warn("verysilly.site is not in the ring")
        return
    }
    
    const prev = sites[(currentIndex - 1 + sites.length) % sites.length]
    const next = sites[(currentIndex + 1) % sites.length]
    const random = sites[Math.floor(Math.random() * sites.length)]
    
    const elPrev = document.getElementById("silly-prev")
    const elNext = document.getElementById("silly-next")
    const elRand = document.getElementById("silly-rand")
    
    if (elPrev) elPrev.href = prev
    if (elNext) elNext.href = next
    if (elRand) elRand.href = random
})()