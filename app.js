const SUPABASE_URL = "https://sefuulovdserechlxncb.supabase.co";
const SUPABASE_KEY = "sb_publishable_o8YYHkc9w4NzqBvJv8FjkQ_8FXaKGfm";
const BUCKET = "birthday-media";

function getClient() {
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function publicUrl(client, path) {
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

let birthdayPhotos = [];
let currentPhotoIndex = 0;
let photoTransitioning = false;


/* =========================================================
   FLOATING BIRTHDAY DECORATIONS
   ========================================================= */

function createBirthdayDecorations() {
  if (document.querySelector(".birthday-floaters")) return;

  const container = document.createElement("div");
  container.className = "birthday-floaters";
  container.setAttribute("aria-hidden", "true");

  const decorations = [
    "🎈", "✨", "🎈", "🌸", "✨",
    "🎈", "⭐", "🌼", "✨", "🎈",
    "🎉", "🌸"
  ];

  decorations.forEach((emoji, index) => {
    const item = document.createElement("span");

    item.className = "birthday-floater";
    item.textContent = emoji;

    item.style.setProperty(
      "--float-delay",
      `${index * 0.7}s`
    );

    item.style.setProperty(
      "--float-duration",
      `${5 + (index % 4)}s`
    );

    item.style.left =
      `${5 + Math.random() * 90}%`;

    item.style.top =
      `${8 + Math.random() * 82}%`;

    container.appendChild(item);
  });

  document.body.appendChild(container);
}


/* =========================================================
   PHOTO GALLERY
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

    birthdayPhotos = data.filter(
      item => item.type === "photo"
    );

    const music = data.find(
      item => item.type === "music"
    );


    /* =====================================================
       PHOTOS
       ===================================================== */

    const gallery =
      document.getElementById("gallery");

    if (gallery) {

      gallery.innerHTML = "";

      if (!birthdayPhotos.length) {

        gallery.innerHTML =
          '<div class="empty">📸<br><b>Memories coming soon...</b></div>';

      } else {

        birthdayPhotos.forEach((photo, index) => {

          const box =
            document.createElement("div");

          box.className = "photo";

          if (index === 1) {
            box.classList.add("tall");
          }

          if (index === 3) {
            box.classList.add("wide");
          }

          box.setAttribute("role", "button");
          box.setAttribute("tabindex", "0");

          box.setAttribute(
            "aria-label",
            `Open photo ${index + 1}`
          );

          const img =
            document.createElement("img");

          img.src =
            publicUrl(
              client,
              photo.file_path
            );

          img.alt = "Birthday memory";
          img.loading = "lazy";

          box.appendChild(img);
          gallery.appendChild(box);


          /* Staggered gallery entrance */

          setTimeout(() => {
            box.classList.add("visible");
          }, Math.min(index * 130, 900));


          box.addEventListener(
            "click",
            () => openPhotoViewer(index)
          );


          box.addEventListener(
            "keydown",
            event => {

              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                openPhotoViewer(index);
              }

            }
          );

        });
      }
    }


    if (galleryStatus) {

      galleryStatus.textContent =
        birthdayPhotos.length
          ? `${birthdayPhotos.length} little memories`
          : "A few memories are waiting to be added.";
    }


    /* =====================================================
       BACKGROUND MUSIC
       ===================================================== */

    if (music) {

      const player =
        document.getElementById("player");

      if (player) {

        player.src =
          publicUrl(
            client,
            music.file_path
          );

        player.loop = true;
        player.volume = 0.55;
        player.preload = "auto";
      }
    }

  } catch (error) {

    console.warn(
      "Media unavailable:",
      error
    );

    if (galleryStatus) {
      galleryStatus.textContent =
        "Your memories will appear here soon. ❤️";
    }
  }
}


/* =========================================================
   PHOTO VIEWER
   ========================================================= */

function getPhotoViewer() {
  return document.getElementById("photoViewer");
}


function updatePhotoViewer() {

  const viewer =
    getPhotoViewer();

  if (!viewer || !birthdayPhotos.length) {
    return;
  }

  const image =
    viewer.querySelector(
      ".photo-viewer-image"
    );

  const counter =
    viewer.querySelector(
      ".photo-viewer-counter"
    );

  const client = getClient();

  const photo =
    birthdayPhotos[currentPhotoIndex];

  image.src =
    publicUrl(
      client,
      photo.file_path
    );

  image.alt =
    `Birthday memory ${currentPhotoIndex + 1}`;

  if (counter) {

    counter.textContent =
      `${currentPhotoIndex + 1} / ${birthdayPhotos.length}`;
  }
}


function openPhotoViewer(index) {

  if (!birthdayPhotos.length) {
    return;
  }

  currentPhotoIndex =
    Math.max(
      0,
      Math.min(
        index,
        birthdayPhotos.length - 1
      )
    );

  const viewer =
    getPhotoViewer();

  if (!viewer) {
    return;
  }

  viewer.setAttribute(
    "data-direction",
    "none"
  );

  updatePhotoViewer();

  viewer.classList.add("open");

  viewer.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "photo-viewer-open"
  );
}


function closePhotoViewer() {

  const viewer =
    getPhotoViewer();

  if (!viewer) {
    return;
  }

  viewer.classList.remove("open");

  viewer.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove(
    "photo-viewer-open"
  );
}


/* =========================================================
   ANIMATED PHOTO SLIDER
   ========================================================= */

function changePhoto(direction) {

  if (
    !birthdayPhotos.length ||
    photoTransitioning
  ) {
    return;
  }

  const viewer =
    getPhotoViewer();

  const image =
    viewer?.querySelector(
      ".photo-viewer-image"
    );

  if (!viewer || !image) {
    return;
  }

  photoTransitioning = true;

  const outClass =
    direction === "next"
      ? "slide-out-left"
      : "slide-out-right";

  const inClass =
    direction === "next"
      ? "slide-in-right"
      : "slide-in-left";


  image.classList.add(outClass);


  setTimeout(() => {

    if (direction === "next") {

      currentPhotoIndex =
        (
          currentPhotoIndex + 1
        ) %
        birthdayPhotos.length;

    } else {

      currentPhotoIndex =
        (
          currentPhotoIndex -
          1 +
          birthdayPhotos.length
        ) %
        birthdayPhotos.length;
    }


    image.classList.remove(outClass);

    updatePhotoViewer();

    image.classList.add(inClass);

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        image.classList.remove(
          inClass
        );

      });

    });


    setTimeout(() => {

      photoTransitioning = false;

    }, 450);

  }, 280);
}


function showPreviousPhoto() {
  changePhoto("previous");
}


function showNextPhoto() {
  changePhoto("next");
}


/* =========================================================
   CONFETTI
   ========================================================= */

function confetti(amount = 90) {

  const container =
    document.getElementById("confetti");

  if (!container) {
    return;
  }

  for (let i = 0; i < amount; i++) {

    const piece =
      document.createElement("i");

    piece.className =
      "confetti-piece";

    piece.style.left =
      `${Math.random() * 100}vw`;

    piece.style.setProperty(
      "--x",
      `${Math.random() * 260 - 130}px`
    );

    piece.style.animationDuration =
      `${2.8 + Math.random() * 2.8}s`;

    piece.style.animationDelay =
      `${Math.random() * 0.35}s`;

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

    container.appendChild(piece);

    setTimeout(
      () => piece.remove(),
      6500
    );
  }
}


/* =========================================================
   LITTLE SPARKLE BURST
   ========================================================= */

function sparkleBurst(element) {

  if (!element) return;

  const rect =
    element.getBoundingClientRect();

  for (let i = 0; i < 14; i++) {

    const sparkle =
      document.createElement("span");

    sparkle.className =
      "sparkle-burst";

    sparkle.textContent =
      i % 2 === 0
        ? "✨"
        : "⭐";

    sparkle.style.left =
      `${rect.left + rect.width / 2}px`;

    sparkle.style.top =
      `${rect.top + rect.height / 2}px`;

    sparkle.style.setProperty(
      "--sx",
      `${Math.cos(i * Math.PI / 7) * 100}px`
    );

    sparkle.style.setProperty(
      "--sy",
      `${Math.sin(i * Math.PI / 7) * 100}px`
    );

    document.body.appendChild(
      sparkle
    );

    setTimeout(
      () => sparkle.remove(),
      1000
    );
  }
}


/* =========================================================
   BIRTHDAY SURPRISE
   ========================================================= */

function createBirthdaySurprise() {

  if (
    document.getElementById(
      "birthdaySurprise"
    )
  ) {
    return;
  }

  const section =
    document.createElement("section");

  section.id =
    "birthdaySurprise";

  section.className =
    "birthday-surprise";

  section.innerHTML = `
    <div class="surprise-card">

      <div class="surprise-eyebrow">
        A tiny birthday surprise 🎁
      </div>

      <button
        id="giftButton"
        class="gift-button"
        type="button"
        aria-label="Open birthday gift"
      >
        🎁
      </button>

      <p class="surprise-hint">
        one last little surprise...
      </p>

      <div
        id="giftMessage"
        class="gift-message"
      >
        <h2>
          You deserve the happiest year yet! 🎂✨
        </h2>

        <p>
          Keep smiling, keep dreaming,
          keep being wonderfully you.
        </p>
      </div>

    </div>
  `;

  const final =
    document.querySelector(
      ".final"
    );

  if (final) {
    final.before(section);
  } else {
    document
      .getElementById("content")
      ?.appendChild(section);
  }


  const giftButton =
    document.getElementById(
      "giftButton"
    );

  const giftMessage =
    document.getElementById(
      "giftMessage"
    );

  giftButton?.addEventListener(
    "click",
    () => {

      giftButton.classList.add(
        "gift-open"
      );

      giftMessage.classList.add(
        "show"
      );

      sparkleBurst(
        giftButton
      );

      confetti(55);
    }
  );
}


/* =========================================================
   LETTER + FINAL NOTE REVEAL
   ========================================================= */

function setupScrollAnimations() {

  const elements =
    document.querySelectorAll(
      ".letter-wrap, .final, .birthday-surprise"
    );

  if (
    !("IntersectionObserver" in window)
  ) {

    elements.forEach(
      element =>
        element.classList.add(
          "scroll-visible"
        )
    );

    return;
  }


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "scroll-visible"
              );

              observer.unobserve(
                entry.target
              );
            }

          }
        );

      },
      {
        threshold: 0.12
      }
    );


  elements.forEach(
    element =>
      observer.observe(element)
  );
}


/* =========================================================
   MUSIC VISUALIZER
   ========================================================= */

function setupMusic(player, musicToggle) {

  if (!player || !musicToggle) {
    return;
  }

  musicToggle.addEventListener(
    "click",
    async () => {

      if (player.paused) {

        try {

          await player.play();

        } catch (error) {

          console.warn(
            "Music could not start:",
            error
          );
        }

      } else {

        player.pause();
      }
    }
  );


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


/* =========================================================
   FINAL BIRTHDAY CELEBRATION
   ========================================================= */

function setupFinalCelebration() {

  const final =
    document.querySelector(
      ".final"
    );

  if (!final) return;

  if (
    final.dataset.celebrationReady
  ) {
    return;
  }

  final.dataset.celebrationReady =
    "true";


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              final.classList.add(
                "birthday-finale"
              );

              confetti(35);

              setTimeout(
                () => confetti(25),
                900
              );

              observer.disconnect();
            }

          }
        );

      },
      {
        threshold: 0.45
      }
    );


  observer.observe(final);
}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    createBirthdayDecorations();

    createBirthdaySurprise();


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
       TEDDY OPENING
       ===================================================== */

    if (
      button &&
      content
    ) {

      button.addEventListener(
        "click",
        async event => {

          event.preventDefault();

          button.classList.add(
            "teddy-hug"
          );

          sparkleBurst(
            button
          );

          content.classList.remove(
            "hidden"
          );

          confetti(110);


          /* Start music */

          if (
            player &&
            player.src
          ) {

            try {

              player.volume =
                0.55;

              player.loop =
                true;

              await player.play();

            } catch (error) {

              console.warn(
                "Music could not start:",
                error
              );
            }
          }


          setTimeout(
            () => {

              content.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });

            },
            150
          );
        }
      );
    }


    setupMusic(
      player,
      musicToggle
    );


    /* =====================================================
       PHOTO VIEWER
       ===================================================== */

    const viewer =
      document.getElementById(
        "photoViewer"
      );

    if (viewer) {

      const closeButton =
        viewer.querySelector(
          ".photo-viewer-close"
        );

      const previousButton =
        viewer.querySelector(
          ".photo-viewer-prev"
        );

      const nextButton =
        viewer.querySelector(
          ".photo-viewer-next"
        );


      closeButton?.addEventListener(
        "click",
        closePhotoViewer
      );


      previousButton?.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          showPreviousPhoto();
        }
      );


      nextButton?.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          showNextPhoto();
        }
      );


      viewer.addEventListener(
        "click",
        event => {

          if (
            event.target === viewer
          ) {

            closePhotoViewer();
          }
        }
      );


      /* Keyboard */

      document.addEventListener(
        "keydown",
        event => {

          if (
            !viewer.classList.contains(
              "open"
            )
          ) {
            return;
          }

          if (
            event.key === "Escape"
          ) {

            closePhotoViewer();

          } else if (
            event.key === "ArrowLeft"
          ) {

            showPreviousPhoto();

          } else if (
            event.key === "ArrowRight"
          ) {

            showNextPhoto();
          }
        }
      );


      /* Swipe */

      let touchStartX = 0;
      let touchStartY = 0;

      viewer.addEventListener(
        "touchstart",
        event => {

          if (
            event.touches.length
          ) {

            touchStartX =
              event.touches[0].clientX;

            touchStartY =
              event.touches[0].clientY;
          }
        },
        {
          passive: true
        }
      );


      viewer.addEventListener(
        "touchend",
        event => {

          if (
            !event.changedTouches.length
          ) {
            return;
          }

          const endX =
            event.changedTouches[0].clientX;

          const endY =
            event.changedTouches[0].clientY;

          const deltaX =
            endX - touchStartX;

          const deltaY =
            endY - touchStartY;


          if (
            Math.abs(deltaX) < 50 ||
            Math.abs(deltaX) <
              Math.abs(deltaY)
          ) {
            return;
          }


          if (deltaX < 0) {
            showNextPhoto();
          } else {
            showPreviousPhoto();
          }

        },
        {
          passive: true
        }
      );
    }


    /* =====================================================
       LOAD
       ===================================================== */

    loadMedia();

    loadSiteContent();

    setupScrollAnimations();

    setupFinalCelebration();

  }
);


/* =========================================================
   EDITABLE CONTENT
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


    const letter =
      document.getElementById(
        "letterContent"
      );

    if (
      letter &&
      map.letter_html
    ) {

      letter.innerHTML =
        map.letter_html;
    }


    const title =
      document.getElementById(
        "finalNoteTitle"
      );

    if (
      title &&
      map.final_note_title
    ) {

      title.innerHTML =
        map.final_note_title;
    }


    const caption =
      document.getElementById(
        "finalNoteCaption"
      );

    if (
      caption &&
      map.final_note_caption
    ) {

      caption.textContent =
        map.final_note_caption;
    }

  } catch (error) {

    console.warn(
      "Editable text unavailable:",
      error
    );
  }
}
