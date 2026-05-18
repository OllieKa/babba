(function () {
  const releaseList = document.getElementById('releaseList');
  const nextTrack = document.getElementById('nextTrack');
  const countdown = document.getElementById('countdown');
  const releases = Array.isArray(window.BIG_BABBA_RELEASES) ? window.BIG_BABBA_RELEASES : [];

  const services = [
    { key: 'spotify', label: 'Spotify', icon: './assets/spotify.svg' },
    { key: 'appleMusic', label: 'Apple Music', icon: './assets/applemusic.svg' },
    { key: 'amazonMusic', label: 'Amazon Music', icon: './assets/amazonmusic.svg' },
    { key: 'deezer', label: 'Deezer', icon: './assets/deezer.svg' },
    { key: 'tidal', label: 'Tidal', icon: './assets/tidal.svg' }
  ];

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function formatDate(value) {
    const [year, month, day] = value.split('-');
    return `${day}.${month}.${year}`;
  }

  function releaseDate(value) {
    return new Date(`${value}T00:00:00`);
  }

  function serviceUrl(release, service) {
    const links = release.links || {};
    return String(links[service.key] || '').trim();
  }

  function renderServiceLinks(release, title) {
    return services.map(service => {
      const url = serviceUrl(release, service);

      if (!url) return '';

      return `
        <a class="service-link ${service.key}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="${title} bei ${service.label} hoeren" title="${service.label}">
          <img src="${service.icon}" alt="" loading="lazy" />
        </a>
      `;
    }).join('');
  }

  function renderPresaveLink(release, title) {
    const hyperfollowUrl = String(release.hyperfollowUrl || '').trim();

    if (!hyperfollowUrl) return '';

    return `
      <a class="presave-link" href="${escapeHtml(hyperfollowUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${title} bei Hyperfollow pre-saven">Pre-save</a>
    `;
  }

  function renderReleases() {
    releaseList.innerHTML = releases.map(release => {
      const title = escapeHtml(release.title);
      const dateLabel = formatDate(release.date);
      const cover = escapeHtml(release.cover || './assets/1.webp');
      const serviceLinks = renderServiceLinks(release, title);
      const presaveLink = renderPresaveLink(release, title);

      return `
        <article class="release-card" data-date="${escapeHtml(release.date)}">
          <button class="release-cover" type="button" aria-label="Cover von ${title} vergroessern">
            <img src="${cover}" alt="Cover: ${title}" loading="lazy" />
          </button>
          <time datetime="${escapeHtml(release.date)}">${dateLabel}</time>
          <h3>${title}</h3>
          <span class="badge">Geplant</span>
          <div class="song-links">
            ${serviceLinks}
            ${presaveLink}
          </div>
        </article>
      `;
    }).join('');
  }

  function updateReleaseState() {
    const cards = [...document.querySelectorAll('.release-card')];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const renderedReleases = cards.map(card => ({
      card,
      date: releaseDate(card.dataset.date),
      title: card.querySelector('h3').textContent,
      badge: card.querySelector('.badge')
    }));

    const released = renderedReleases.filter(release => release.date <= today);
    const upcoming = renderedReleases.filter(release => release.date > today).sort((a, b) => a.date - b.date);

    released.forEach(release => {
      release.card.classList.add('released');
    });

    if (released.length > 0) {
      const latest = [...released].sort((a, b) => b.date - a.date)[0];
      latest.card.classList.add('current');
    }

    if (upcoming.length > 0) {
      const next = upcoming[0];
      const days = Math.round((next.date - today) / 86400000);

      next.card.classList.add('next');
      nextTrack.textContent = `${next.title} · ${next.card.querySelector('time').textContent}`;

      if (days === 0) countdown.textContent = 'Heute!';
      else if (days === 1) countdown.textContent = '1 Tag';
      else countdown.textContent = `${days} Tage`;
    } else {
      nextTrack.textContent = 'Alle Tracks sind verfuegbar';
      countdown.textContent = 'Out now';
    }
  }

  function setupCoverLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'cover-lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = `
      <button class="cover-lightbox__backdrop" type="button" aria-label="Cover schliessen"></button>
      <figure class="cover-lightbox__frame">
        <img src="" alt="" />
      </figure>
    `;
    document.body.appendChild(lightbox);

    const image = lightbox.querySelector('img');
    const frame = lightbox.querySelector('.cover-lightbox__frame');

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      image.removeAttribute('src');
      image.alt = '';
    }

    releaseList.addEventListener('click', event => {
      const coverButton = event.target.closest('.release-cover');

      if (!coverButton) return;

      const coverImage = coverButton.querySelector('img');
      image.src = coverImage.currentSrc || coverImage.src;
      image.alt = coverImage.alt;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
    });

    lightbox.addEventListener('click', event => {
      if (!frame.contains(event.target)) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    });
  }

  if (!releaseList || !nextTrack || !countdown) return;

  renderReleases();
  updateReleaseState();
  setupCoverLightbox();
})();
