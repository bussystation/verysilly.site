document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch("/utils/projects.json");
        const data = await res.json();

        const categories = [
            { key: "favourites", containerClass: "favourite-projects" },
            { key: "games", containerClass: "game-projects" },
            { key: "websites", containerClass: "website-projects" }
        ];

        categories.forEach(cat => {
            const projects = data[cat.key] || [];
            const container = document.querySelector(`.${cat.containerClass}`);
            if (!container) return;

            container.innerHTML = projects.map(p => {
                // build language badges
                const languages = (p.languages || [])
                    .map(lang => `<span class="${lang.class}">${lang.name}</span>`)
                    .join("/");

                const cardContent = `
                    <div class="project-card">
                        ${p.icon ? `<i class="${p.icon}"></i>` : ""}
                        ${p.logo ? `<img src="${p.logo}" alt="${p.title}" class="project-logo">` : ""}
                        <section class="project-info">
                            <h3 class="project-title">${p.title}</h3>
                            <p class="project-desc">${p.description}</p>
                            <p class="project-code">${languages}</p>
                            <p class="project-status-${p.status}">${p.status}</p>
                        </section>
                    </div>
                `;
                // wrap in link if url exists
                return p.url ? `<a href="${p.url}" target="_blank">${cardContent}</a>` : cardContent;
            }).join("");
        });

    } catch (err) {
        console.error("Failed to load projects:", err);
        // TODO: maybe show an error message to the user?
    }
});