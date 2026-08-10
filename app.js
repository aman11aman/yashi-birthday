const SUPABASE_URL = "https://sefuulovdserechlxncb.supabase.co";
const SUPABASE_KEY = "sb_publishable_o8YYHkc9w4NzqBvJv8FjkQ_8FXaKGfm";
const BUCKET = "birthday-media";

function getClient() {
  return window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
}

function publicUrl(client, path) {
  return client.storage
    .from(BUCKET)
    .getPublicUrl(path)
    .data.publicUrl;
}


/* =========================================================
   LOAD PHOTOS, COLLAGE & MUSIC
   ========================================================= */

async function loadMedia() {
  const galleryStatus =
    document.getElementById("galleryStatus");

  try {
    if (!window.supabase) {
      throw new Error("Supabase library unavailable.");
    }

    const client = getClient();

    const result = await client
      .from("birthday_media")
      .select("*")
      .order("display_order", {
        ascending: true
      })
      .order("created_at", {
        ascending: true
      });

    if (result.error) {
      throw result.error;
    }

    const data = result.data || [];

    const photos = data.filter(
      item => item.type === "photo"
    );

    const collage = data.find(
      item => item.type === "collage"
    );

    const music = data.find(
      item => item.type === "music"
    );

    /* -------------------------
       PHOTOS
       ------------------------- */

    const gallery =
      document.getElementById("gallery");

    if (gallery) {

      gallery.innerHTML = "";

      if (!photos.length) {

        gallery.innerHTML =
          '<div class="empty">📸<br><b>Memories coming soon...</b></div>';

      } else {

        photos.forEach((photo, index) => {

          const box =
            document.createElement("div");

          box.className = "photo";

          if (index === 1) {
            box.classList.add("tall");
          }

          if (index === 3) {
            box.classList.add("wide");
          }

          const img =
            document.createElement("img");

          img.src =
            publicUrl(
              client,
              photo.file_path
            );

          img.alt = "A memory";

          img.loading = "lazy";

          box.appendChild(img);

          gallery.appendChild(box);
        });
      }
    }

    if (galleryStatus) {

      galleryStatus.textContent =
        photos.length
          ? photos.length +
            " little memories"
          : "A few memories are waiting to be added.";
    }


    /* -------------------------
       COLLAGE
       ------------------------- */

    if (collage) {

      const box =
        document.getElementById(
          "collageBox"
        );

      if (box) {

        box.innerHTML = "";

        const img =
          document.createElement("img");

        img.src =
          publicUrl(
            client,
            collage.file_path
          );

        img.alt =
          "Yashi's collage";

        img.loading = "lazy";

        box.appendChild(img);
      }
    }


    /* -------------------------
       BACKGROUND MUSIC
       ------------------------- */

    if (music) {

      const player =
        document.getElementById(
          "player"
        );

      if (player) {

        player.src =
          publicUrl(
            client,
            music.file_path
          );

        player.loop = true;

        /*
         * Keep the music soft in the background.
         */
        player.volume = 0.55;

        player.preload = "auto";
      }
    }

  } catch (error) {

    console.warn(
      "Media is unavailable right now:",
      error
    );

    if (galleryStatus) {

      galleryStatus.textContent =
        "Your memories will appear here soon. ❤️";
    }
  }
}


/* =========================================================
   CONFETTI
   ========================================================= */

function confetti() {

  const container =
    document.getElementById(
      "confetti"
    );

  if (!container) return;

  for (let i = 0; i < 90; i++) {

    const piece =
      document.createElement("i");

    piece.className =
      "confetti-piece";

    piece.style.left =
      Math.random() * 100 + "vw";

    piece.style.setProperty(
      "--x",
      (Math.random() * 260 - 130) +
        "px"
    );

    piece.style.animationDuration =
      (2.8 + Math.random() * 2.8) +
      "s";

    piece.style.animationDelay =
      Math.random() * 0.35 +
      "s";

    piece.style.background =
      [
        "#ff7d9b",
        "#ffd166",
        "#7fd1b9",
        "#8bb8ff",
        "#c8a1ff"
      ][
        Math.floor(
          Math.random() * 5
        )
      ];

    container.appendChild(
      piece
    );

    setTimeout(
      () => piece.remove(),
      6500
    );
  }
}


/* =========================================================
   BIRTHDAY EXPERIENCE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const button =
      document.getElementById(
        "openBtn"
      );

    const content =
      document.getElementById(
        "content"
      );

    const player =
      document.getElementById(
        "player"
      );

    const musicToggle =
      document.getElementById(
        "musicToggle"
      );


    /* =====================================================
       TEDDY CLICK
       ===================================================== */

    if (button && content) {

      button.addEventListener(
        "click",
        async () => {

          /*
           * Teddy animation
           */
          button.classList.add(
            "teddy-hug"
          );


          /*
           * Open birthday content
           */
          content.classList.remove(
            "hidden"
          );


          /*
           * Birthday confetti
           */
          confetti();


          /*
           * Start the birthday song.
           *
           * This works because the teddy click
           * is a real user interaction, which
           * browsers allow to start audio.
           */

          if (
            player &&
            player.src
          ) {

            try {

              player.volume = 0.55;

              player.loop = true;

              await player.play();


              /*
               * Update floating music button
               */

              if (musicToggle) {

                musicToggle.textContent =
                  "🎵";

                musicToggle.classList.add(
                  "playing"
                );

                musicToggle.setAttribute(
                  "aria-label",
                  "Pause birthday music"
                );

                musicToggle.setAttribute(
                  "aria-pressed",
                  "true"
                );
              }

            } catch (error) {

              console.warn(
                "Music could not start:",
                error
              );
            }
          }


          /*
           * Smoothly move into the birthday
           */
          setTimeout(
            () => {

              content.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });

            },
            20
          );
        }
      );
    }


    /* =====================================================
       FLOATING MUSIC BUTTON
       ===================================================== */

    if (
      musicToggle &&
      player
    ) {

      musicToggle.addEventListener(
        "click",
        async () => {

          /*
           * If music is paused,
           * start it again.
           */

          if (player.paused) {

            try {

              await player.play();

              musicToggle.textContent =
                "🎵";

              musicToggle.classList.add(
                "playing"
              );

              musicToggle.setAttribute(
                "aria-label",
                "Pause birthday music"
              );

              musicToggle.setAttribute(
                "aria-pressed",
                "true"
              );

            } catch (error) {

              console.warn(
                "Music could not start:",
                error
              );
            }

          }

          /*
           * Otherwise pause it.
           */

          else {

            player.pause();

            musicToggle.textContent =
              "🔇";

            musicToggle.classList.remove(
              "playing"
            );

            musicToggle.setAttribute(
              "aria-label",
              "Play birthday music"
            );

            musicToggle.setAttribute(
              "aria-pressed",
              "false"
            );
          }
        }
      );


      /*
       * Keep button state synchronized
       * with the audio player.
       */

      player.addEventListener(
        "play",
        () => {

          musicToggle.textContent =
            "🎵";

          musicToggle.classList.add(
            "playing"
          );

          musicToggle.setAttribute(
            "aria-label",
            "Pause birthday music"
          );

          musicToggle.setAttribute(
            "aria-pressed",
            "true"
          );
        }
      );


      player.addEventListener(
        "pause",
        () => {

          musicToggle.textContent =
            "🔇";

          musicToggle.classList.remove(
            "playing"
          );

          musicToggle.setAttribute(
            "aria-label",
            "Play birthday music"
          );

          musicToggle.setAttribute(
            "aria-pressed",
            "false"
          );
        }
      );
    }


    /* =====================================================
       LOAD MEDIA
       ===================================================== */

    /*
     * Media errors should never prevent
     * the birthday landing page from working.
     */

    loadMedia();

  }
);


/* =========================================================
   EDITABLE LETTER & FINAL NOTE
   ========================================================= */

async function loadSiteContent() {

  try {

    if (!window.supabase) {
      return;
    }

    const client =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

    const {
      data,
      error
    } =
      await client
        .from("site_content")
        .select("key,value");

    if (error) {
      throw error;
    }

    const map =
      Object.fromEntries(
        (data || []).map(
          row => [
            row.key,
            row.value
          ]
        )
      );


    /* -------------------------
       LETTER
       ------------------------- */

    if (map.letter_html) {

      const el =
        document.getElementById(
          "letterContent"
        );

      if (el) {

        el.innerHTML =
          map.letter_html;
      }
    }


    /* -------------------------
       FINAL NOTE TITLE
       ------------------------- */

    if (
      map.final_note_title
    ) {

      const el =
        document.getElementById(
          "finalNoteTitle"
        );

      if (el) {

        el.innerHTML =
          map.final_note_title;
      }
    }


    /* -------------------------
       FINAL NOTE CAPTION
       ------------------------- */

    if (
      map.final_note_caption
    ) {

      const el =
        document.getElementById(
          "finalNoteCaption"
        );

      if (el) {

        el.textContent =
          map.final_note_caption;
      }
    }

  } catch (error) {

    console.warn(
      "Editable text is unavailable; using built-in text.",
      error
    );
  }
}


/* =========================================================
   LOAD EDITABLE CONTENT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  loadSiteContent
);
