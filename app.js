const SUPABASE_URL = "https://sefuulovdserechlxncb.supabase.co";
const SUPABASE_KEY = "sb_publishable_o8YYHkc9w4NzqBvJv8FjkQ_8FXaKGfm";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET = "birthday-media";

function publicUrl(path) {
  return supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function loadMedia() {
  const status = document.getElementById("galleryStatus");
  try {
    const result = await supabaseClient
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
        img.src = publicUrl(photo.file_path);
        img.alt = "A memory";
        img.loading = "lazy";
        box.appendChild(img);
        gallery.appendChild(box);
      });
    }

    status.textContent = photos.length
      ? photos.length + " little memories"
      : "A few memories are waiting to be added.";

    if (collage) {
      const box = document.getElementById("collageBox");
      box.innerHTML = "";
      const img = document.createElement("img");
      img.src = publicUrl(collage.file_path);
      img.alt = "Yashi's collage";
      img.loading = "lazy";
      box.appendChild(img);
    }

    if (music) {
      document.getElementById("player").src = publicUrl(music.file_path);
    }
  } catch (error) {
    console.error("Media loading error:", error);
    status.textContent = "Your memories will appear here soon. ❤️";
  }
}

function startConfetti() {
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
    window.setTimeout(() => piece.remove(), 6500);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("openBtn");
  const content = document.getElementById("content");

  button.addEventListener("click", () => {
    content.classList.remove("hidden");
    button.disabled = true;
    button.textContent = "Happy Birthday, Yashi! 🎂";
    startConfetti();
    window.setTimeout(() => {
      content.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  });

  loadMedia();
});
