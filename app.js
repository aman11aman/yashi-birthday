const SUPABASE_URL = "https://sefuulovdserechlxncb.supabase.co";
const SUPABASE_KEY = "sb_publishable_o8YYHkc9w4NzqBvJv8FjkQ_8FXaKGfm";
const BUCKET = "birthday-media";

function getClient() {
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function publicUrl(client, path) {
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function loadMedia() {
  const galleryStatus = document.getElementById("galleryStatus");
  try {
    if (!window.supabase) throw new Error("Supabase library unavailable.");
    const client = getClient();
    const result = await client
      .from("birthday_media")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (result.error) throw result.error;

    const data = result.data || [];
    const photos = data.filter(item => item.type === "photo");
    const collage = data.find(item => item.type === "collage");
    const music = data.find(item => item.type === "music");
    const gallery = document.getElementById("gallery");

    gallery.innerHTML = "";

    if (!photos.length) {
      gallery.innerHTML = '<div class="empty">📸<br><b>Memories coming soon...</b></div>';
    } else {
      photos.forEach((photo, index) => {
        const box = document.createElement("div");
        box.className = "photo";
        if (index === 1) box.classList.add("tall");
        if (index === 3) box.classList.add("wide");

        const img = document.createElement("img");
        img.src = publicUrl(client, photo.file_path);
        img.alt = "A memory";
        img.loading = "lazy";
        box.appendChild(img);
        gallery.appendChild(box);
      });
    }

    galleryStatus.textContent = photos.length
      ? photos.length + " little memories"
      : "A few memories are waiting to be added.";

    if (collage) {
      const box = document.getElementById("collageBox");
      box.innerHTML = "";
      const img = document.createElement("img");
      img.src = publicUrl(client, collage.file_path);
      img.alt = "Yashi's collage";
      img.loading = "lazy";
      box.appendChild(img);
    }

    if (music) {
      document.getElementById("player").src = publicUrl(client, music.file_path);
    }
  } catch (error) {
    console.warn("Media is unavailable right now:", error);
    if (galleryStatus) {
      galleryStatus.textContent = "Your memories will appear here soon. ❤️";
    }
  }
}

function confetti() {
  const container = document.getElementById("confetti");
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement("i");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.setProperty("--x", (Math.random() * 260 - 130) + "px");
    piece.style.animationDuration = (2.8 + Math.random() * 2.8) + "s";
    piece.style.animationDelay = (Math.random() * 0.35) + "s";
    piece.style.background = ["#ff7d9b", "#ffd166", "#7fd1b9", "#8bb8ff", "#c8a1ff"][Math.floor(Math.random() * 5)];
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 6500);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // The landing button is a real anchor to #content, so it works
  // even if Supabase or this script fails.
  const button = document.getElementById("openBtn");
  const content = document.getElementById("content");

  if (button && content) {
    button.addEventListener("click", () => {
      button.classList.add("teddy-hug");
      content.classList.remove("hidden");
      setTimeout(() => content.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
      confetti();
    });
  }

  // Never let media errors affect the landing page.
  loadMedia();
});

async function loadSiteContent() {
  try {
    if (!window.supabase) return;
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await client.from("site_content").select("key,value");
    if (error) throw error;
    const map = Object.fromEntries((data || []).map(row => [row.key, row.value]));
    if (map.letter_html) {
      const el = document.getElementById("letterContent");
      if (el) el.innerHTML = map.letter_html;
    }
    if (map.final_note_title) {
      const el = document.getElementById("finalNoteTitle");
      if (el) el.innerHTML = map.final_note_title;
    }
    if (map.final_note_caption) {
      const el = document.getElementById("finalNoteCaption");
      if (el) el.textContent = map.final_note_caption;
    }
  } catch (e) {
    console.warn("Editable text is unavailable; using built-in text.", e);
  }
}
document.addEventListener("DOMContentLoaded", loadSiteContent);
/* =========================================================
   BIRTHDAY ANIMATION ENGINE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /*
   * Scroll reveal
   */
  const revealTargets = document.querySelectorAll(
    "main > section, .letter, .music, .collagebox, .note"
  );

  revealTargets.forEach((element) => {
    element.classList.add("reveal");
  });


  /*
   * Reveal elements when they enter the screen
   */
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -60px 0px"
    }
  );

  revealTargets.forEach((element) => {
    revealObserver.observe(element);
  });


  /*
   * Photo-by-photo entrance
   */
  const gallery = document.getElementById("gallery");

  if (gallery) {
    const galleryObserver = new MutationObserver(() => {

      const photos = gallery.querySelectorAll(".photo");

      photos.forEach((photo, index) => {
        photo.classList.add("reveal");

        photo.style.transitionDelay =
          Math.min(index * 90, 500) + "ms";

        revealObserver.observe(photo);
      });

    });

    galleryObserver.observe(gallery, {
      childList: true,
      subtree: true
    });

    /*
     * Handle photos already present
     */
    gallery.querySelectorAll(".photo").forEach((photo, index) => {
      photo.classList.add("reveal");

      photo.style.transitionDelay =
        Math.min(index * 90, 500) + "ms";

      revealObserver.observe(photo);
    });
  }


  /*
   * Music animation
   */
  const player = document.getElementById("player");
  const musicCard = document.querySelector(".music");

  if (player && musicCard) {

    player.addEventListener("play", () => {
      musicCard.classList.add("is-playing");
    });

    player.addEventListener("pause", () => {
      musicCard.classList.remove("is-playing");
    });

    player.addEventListener("ended", () => {
      musicCard.classList.remove("is-playing");
    });
  }


  /*
   * Little celebration when the teddy is opened
   *
   * This complements the existing confetti function
   * without replacing it.
   */
  const teddy = document.querySelector(".teddy");

  if (teddy) {
    teddy.addEventListener("click", () => {

      teddy.classList.remove("teddy-hug");

      void teddy.offsetWidth;

      teddy.classList.add("teddy-hug");

      setTimeout(() => {
        teddy.classList.remove("teddy-hug");
      }, 1400);

    });
  }


  /*
   * Add a few tiny birthday sparkles to the hero.
   */
  const hero = document.querySelector(".hero");

  if (hero) {

    const sparkleCharacters = ["✦", "✧", "•", "✦", "·"];

    for (let i = 0; i < 18; i++) {

      const sparkle = document.createElement("span");

      sparkle.className = "birthday-sparkle";

      sparkle.textContent =
        sparkleCharacters[
          Math.floor(
            Math.random() * sparkleCharacters.length
          )
        ];

      sparkle.style.left =
        Math.random() * 100 + "%";

      sparkle.style.top =
        8 + Math.random() * 82 + "%";

      sparkle.style.animationDelay =
        Math.random() * 4 + "s";

      sparkle.style.animationDuration =
        3.5 + Math.random() * 3 + "s";

      hero.appendChild(sparkle);
    }
  }

});
