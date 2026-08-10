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

let birthdayPhotos = [];
let currentPhotoIndex = 0;
let photoTransitioning = false;


/* =========================================================
   LOAD PHOTOS + MUSIC
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
       PHOTO GALLERY
       ===================================================== */

    const gallery =
      document.getElementById("gallery");

    if (gallery) {

      gallery.innerHTML = "";

      if (!birthdayPhotos.length) {

        gallery.innerHTML =
          '<div class="empty">📸<br><b>Memories coming soon...</b></div>';

      } else {

        birthdayPhotos.forEach(
          (photo, index) => {

            const box =
              document.createElement("div");

            box.className = "photo";

            if (index === 1) {
              box.classList.add("tall");
            }

            if (index === 3) {
              box.classList.add("wide");
            }

            box.setAttribute(
              "role",
              "button"
            );

            box.setAttribute(
              "tabindex",
              "0"
            );

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

            img.alt =
              "Birthday memory";

            img.loading =
              "lazy";

            box.appendChild(img);

            gallery.appendChild(box);


            /* Photo entrance animation */

            setTimeout(
              () => {
                box.classList.add(
                  "visible"
                );
              },
              Math.min(
                index * 120,
                700
              )
            );


            /* Open viewer */

            box.addEventListener(
              "click",
              () => {
                openPhotoViewer(index);
              }
            );


            /* Keyboard */

            box.addEventListener(
              "keydown",
              (event) => {

                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {

                  event.preventDefault();

                  openPhotoViewer(index);
                }
              }
            );
          }
        );
      }
    }


    if (galleryStatus) {

      galleryStatus.textContent =
        birthdayPhotos.length
          ? birthdayPhotos.length +
            " little memories"
          : "A few memories are waiting to be added.";
    }


    /* =====================================================
       BACKGROUND MUSIC
       ===================================================== */

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

        player.loop =
          true;

        player.volume =
          0.55;

        player.preload =
          "auto";
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
   PHOTO VIEWER
   ========================================================= */

function getPhotoViewer() {
  return document.getElementById(
    "photoViewer"
  );
}


function updatePhotoViewer(
  direction = "next"
) {

  const viewer =
    getPhotoViewer();

  if (!viewer) return;

  const image =
    viewer.querySelector(
      ".photo-viewer-image"
    );

  const counter =
    viewer.querySelector(
      ".photo-viewer-counter"
    );

  if (!birthdayPhotos.length) {
    return;
  }

  const photo =
    birthdayPhotos[
      currentPhotoIndex
    ];

  const client =
    getClient();


  /*
   * Prepare the new image.
   */

  const newSrc =
    publicUrl(
      client,
      photo.file_path
    );


  /*
   * Add direction information.
   */

  viewer.setAttribute(
    "data-direction",
    direction
  );


  /*
   * Change the image source.
   */

  image.src =
    newSrc;

  image.alt =
    `Birthday memory ${
      currentPhotoIndex + 1
    }`;


  /*
   * Update counter.
   */

  if (counter) {

    counter.textContent =
      `${currentPhotoIndex + 1} / ${
        birthdayPhotos.length
      }`;
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

  updatePhotoViewer(
    "none"
  );

  viewer.classList.add(
    "open"
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

  viewer.classList.remove(
    "open"
  );

  document.body.classList.remove(
    "photo-viewer-open"
  );
}


/* =========================================================
   ANIMATED PHOTO CHANGE
   ========================================================= */

function changePhoto(
  direction
) {

  if (
    !birthdayPhotos.length ||
    photoTransitioning
  ) {
    return;
  }

  const viewer =
    getPhotoViewer();

  if (!viewer) {
    return;
  }

  const image =
    viewer.querySelector(
      ".photo-viewer-image"
    );

  if (!image) {
    return;
  }

  photoTransitioning = true;


  /*
   * Direction:
   *
   * next = photo moves left
   * previous = photo moves right
   */

  const animationClass =
    direction === "next"
      ? "slide-out-left"
      : "slide-out-right";

  image.classList.add(
    animationClass
  );


  /*
   * Wait for the old image
   * to slide away.
   */

  setTimeout(
    () => {

      if (
        direction === "next"
      ) {

        currentPhotoIndex =
          (
            currentPhotoIndex +
            1
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


      /*
       * Remove old animation.
       */

      image.classList.remove(
        "slide-out-left",
        "slide-out-right"
      );


      /*
       * Update the photo.
       */

      updatePhotoViewer(
        direction
      );


      /*
       * Start new photo
       * from opposite side.
       */

      const slideInClass =
        direction === "next"
          ? "slide-in-right"
          : "slide-in-left";

      image.classList.add(
        slideInClass
      );


      /*
       * Force browser to recognize
       * the starting position.
       */

      void image.offsetWidth;


      /*
       * Animate into center.
       */

      requestAnimationFrame(
        () => {

          image.classList.remove(
            slideInClass
          );
        }
      );


      setTimeout(
        () => {

          photoTransitioning =
            false;

        },
        430
      );

    },
    300
  );
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

function confetti() {

  const container =
    document.getElementById(
      "confetti"
    );

  if (!container) {
    return;
  }

  for (let i = 0; i < 90; i++) {

    const piece =
      document.createElement("i");

    piece.className =
      "confetti-piece";

    piece.style.left =
      Math.random() *
        100 +
      "vw";

    piece.style.setProperty(
      "--x",
      (
        Math.random() *
          260 -
        130
      ) +
        "px"
    );

    piece.style.animationDuration =
      (
        2.8 +
        Math.random() *
          2.8
      ) +
      "s";

    piece.style.animationDelay =
      Math.random() *
        0.35 +
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
          Math.random() *
            5
        )
      ];

    container.appendChild(
      piece
    );

    setTimeout(
      () =>
        piece.remove(),
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
       TEDDY
       ===================================================== */

    if (
      button &&
      content
    ) {

      button.addEventListener(
        "click",
        async () => {

          button.classList.add(
            "teddy-hug"
          );

          content.classList.remove(
            "hidden"
          );

          confetti();


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


          setTimeout(
            () => {

              content.scrollIntoView({
                behavior:
                  "smooth",
                block:
                  "start"
              });

            },
            20
          );
        }
      );
    }


    /* =====================================================
       MUSIC BUTTON
       ===================================================== */

    if (
      musicToggle &&
      player
    ) {

      musicToggle.addEventListener(
        "click",
        async () => {

          if (
            player.paused
          ) {

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

          } else {

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
       PHOTO VIEWER CONTROLS
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


      if (closeButton) {

        closeButton.addEventListener(
          "click",
          closePhotoViewer
        );
      }


      if (previousButton) {

        previousButton.addEventListener(
          "click",
          (event) => {

            event.stopPropagation();

            showPreviousPhoto();
          }
        );
      }


      if (nextButton) {

        nextButton.addEventListener(
          "click",
          (event) => {

            event.stopPropagation();

            showNextPhoto();
          }
        );
      }


      /*
       * Click dark background
       * to close.
       */

      viewer.addEventListener(
        "click",
        (event) => {

          if (
            event.target ===
            viewer
          ) {

            closePhotoViewer();
          }
        }
      );


      /*
       * Keyboard controls.
       */

      document.addEventListener(
        "keydown",
        (event) => {

          if (
            !viewer.classList.contains(
              "open"
            )
          ) {
            return;
          }

          if (
            event.key ===
            "Escape"
          ) {

            closePhotoViewer();

          } else if (
            event.key ===
            "ArrowLeft"
          ) {

            showPreviousPhoto();

          } else if (
            event.key ===
            "ArrowRight"
          ) {

            showNextPhoto();
          }
        }
      );


      /* =================================================
         TOUCH SWIPE
         ================================================= */

      let touchStartX = 0;
      let touchStartY = 0;

      viewer.addEventListener(
        "touchstart",
        (event) => {

          if (
            event.touches.length
          ) {

            touchStartX =
              event.touches[0]
                .clientX;

            touchStartY =
              event.touches[0]
                .clientY;
          }
        },
        {
          passive: true
        }
      );


      viewer.addEventListener(
        "touchend",
        (event) => {

          if (
            !event.changedTouches.length
          ) {
            return;
          }

          const touchEndX =
            event.changedTouches[0]
              .clientX;

          const touchEndY =
            event.changedTouches[0]
              .clientY;

          const deltaX =
            touchEndX -
            touchStartX;

          const deltaY =
            touchEndY -
            touchStartY;


          /*
           * Only treat it as a swipe if
           * horizontal movement is stronger
           * than vertical movement.
           */

          if (
            Math.abs(deltaX) <
              50 ||
            Math.abs(deltaX) <
              Math.abs(deltaY)
          ) {
            return;
          }


          if (
            deltaX < 0
          ) {

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


    /* Load everything */

    loadMedia();

  }
);


/* =========================================================
   EDITABLE LETTER + FINAL NOTE
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


    if (
      map.letter_html
    ) {

      const element =
        document.getElementById(
          "letterContent"
        );

      if (element) {

        element.innerHTML =
          map.letter_html;
      }
    }


    if (
      map.final_note_title
    ) {

      const element =
        document.getElementById(
          "finalNoteTitle"
        );

      if (element) {

        element.innerHTML =
          map.final_note_title;
      }
    }


    if (
      map.final_note_caption
    ) {

      const element =
        document.getElementById(
          "finalNoteCaption"
        );

      if (element) {

        element.textContent =
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


document.addEventListener(
  "DOMContentLoaded",
  loadSiteContent
);
