(() => {
  // Prevent the script from being initialized more than once
  if (window.__YASHI_ADMIN_LOADED__) return;
  window.__YASHI_ADMIN_LOADED__ = true;

  const SUPABASE_URL = "https://sefuulovdserechlxncb.supabase.co";
  const SUPABASE_KEY = "sb_publishable_o8YYHkc9w4NzqBvJv8FjkQ_8FXaKGfm";
  const BUCKET = "birthday-media";

  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  const q = (selector) => document.querySelector(selector);

  let media = [];

  // --------------------------------------------------
  // GENERAL HELPERS
  // --------------------------------------------------

  const status = (text) => {
    const el = q("#status");
    if (el) el.textContent = text;
  };

  const publicUrl = (path) => {
    return supabaseClient.storage
      .from(BUCKET)
      .getPublicUrl(path).data.publicUrl;
  };

  // --------------------------------------------------
  // MEDIA
  // --------------------------------------------------

  async function refresh() {
    const result = await supabaseClient
      .from("birthday_media")
      .select("*")
      .order("display_order")
      .order("created_at");

    if (result.error) {
      status(result.error.message);
      return;
    }

    media = result.data || [];

    const photos = media.filter((item) => item.type === "photo");
    const collage = media.find((item) => item.type === "collage");
    const music = media.find((item) => item.type === "music");

    const photoList = q("#photoList");
    const collagePreview = q("#collagePreview");
    const musicPreview = q("#musicPreview");

    if (photoList) {
      photoList.innerHTML =
        photos
          .map(
            (photo) => `
              <div>
                <img src="${publicUrl(photo.file_path)}">
                <button
                  class="remove"
                  data-id="${photo.id}"
                  data-path="${photo.file_path}"
                >×</button>
              </div>
            `
          )
          .join("") || "<p class='muted'>No photos yet.</p>";
    }

    if (collagePreview) {
      collagePreview.innerHTML = collage
        ? `<img src="${publicUrl(collage.file_path)}">`
        : "<p class='muted'>No collage yet.</p>";
    }

    if (musicPreview) {
      musicPreview.innerHTML = music
        ? `<audio controls src="${publicUrl(music.file_path)}"></audio>`
        : "<p class='muted'>No music yet.</p>";
    }
  }

  async function upload(file, type) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const path =
      type +
      "/" +
      Date.now() +
      "-" +
      crypto.randomUUID() +
      "-" +
      safeName;

    let result = await supabaseClient.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type
      });

    if (result.error) {
      throw result.error;
    }

    result = await supabaseClient
      .from("birthday_media")
      .insert({
        type: type,
        file_path: path,
        file_name: file.name,
        display_order: Math.floor(Date.now()/100000)
      });

    if (result.error) {
      await supabaseClient.storage.from(BUCKET).remove([path]);
      throw result.error;
    }
  }

  async function removeItem(id, path) {
    let result = await supabaseClient
      .from("birthday_media")
      .delete()
      .eq("id", id);

    if (result.error) {
      throw result.error;
    }

    await supabaseClient.storage
      .from(BUCKET)
      .remove([path]);
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const loginForm = q("#loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const loginMsg = q("#loginMsg");

      if (loginMsg) {
        loginMsg.textContent = "Signing in...";
      }

      try {
        const result =
          await supabaseClient.auth.signInWithPassword({
            email: q("#email").value,
            password: q("#password").value
          });

        if (result.error) {
          if (loginMsg) {
            loginMsg.textContent = result.error.message;
          }
          return;
        }

        q("#loginCard").classList.add("hidden");
        q("#panel").classList.remove("hidden");

        await refresh();
        await loadV6Text();

      } catch (error) {
        console.error(error);

        if (loginMsg) {
          loginMsg.textContent =
            error.message || "Login failed.";
        }
      }
    });
  }

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logoutButton = q("#logout");

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      location.reload();
    });
  }

  // --------------------------------------------------
  // PHOTO UPLOAD
  // --------------------------------------------------

  const uploadPhotosButton = q("#uploadPhotos");

  if (uploadPhotosButton) {
    uploadPhotosButton.addEventListener("click", async () => {
      const input = q("#photoInput");
      const files = input ? [...input.files] : [];

      if (!files.length) {
        status("Choose photos first.");
        return;
      }

      try {
        status("Uploading...");

        for (const file of files) {
          await upload(file, "photo");
        }

        input.value = "";

        status("Photos uploaded ❤️");

        await refresh();

      } catch (error) {
        console.error(error);
        status(error.message);
      }
    });
  }

  // --------------------------------------------------
  // COLLAGE UPLOAD
  // --------------------------------------------------

  const uploadCollageButton = q("#uploadCollage");

  if (uploadCollageButton) {
    uploadCollageButton.addEventListener("click", async () => {
      const input = q("#collageInput");
      const file = input ? input.files[0] : null;

      if (!file) {
        status("Choose a collage first.");
        return;
      }

      try {
        const oldCollage = media.find(
          (item) => item.type === "collage"
        );

        if (oldCollage) {
          await removeItem(
            oldCollage.id,
            oldCollage.file_path
          );
        }

        await upload(file, "collage");

        input.value = "";

        status("Collage updated ❤️");

        await refresh();

      } catch (error) {
        console.error(error);
        status(error.message);
      }
    });
  }

  // --------------------------------------------------
  // MUSIC UPLOAD
  // --------------------------------------------------

  const uploadMusicButton = q("#uploadMusic");

  if (uploadMusicButton) {
    uploadMusicButton.addEventListener("click", async () => {
      const input = q("#musicInput");
      const file = input ? input.files[0] : null;

      if (!file) {
        status("Choose audio first.");
        return;
      }

      try {
        const oldMusic = media.find(
          (item) => item.type === "music"
        );

        if (oldMusic) {
          await removeItem(
            oldMusic.id,
            oldMusic.file_path
          );
        }

        await upload(file, "music");

        input.value = "";

        status("Music updated ❤️");

        await refresh();

      } catch (error) {
        console.error(error);
        status(error.message);
      }
    });
  }

  // --------------------------------------------------
  // REMOVE PHOTO
  // --------------------------------------------------

  const photoList = q("#photoList");

  if (photoList) {
    photoList.addEventListener("click", async (event) => {
      const button = event.target.closest(".remove");

      if (!button) return;

      if (!confirm("Remove this photo?")) {
        return;
      }

      try {
        await removeItem(
          button.dataset.id,
          button.dataset.path
        );

        status("Photo removed.");

        await refresh();

      } catch (error) {
        console.error(error);
        status(error.message);
      }
    });
  }

  // --------------------------------------------------
  // BIRTHDAY LETTER
  // --------------------------------------------------

  const V6_DEFAULT_LETTER = `
Happy birthdayyy to my favourite human. 🥹❤️

I honestly don't know where to start because there is just so much I want to say about you.

From the day you came into my life, somehow you became my favourite person. It just... happened.

I love your smile. Like seriously, your smile is the best. And when you laugh, you look sooo cute. 😂

And your big eyes... they are so dreamy. ❤️

And I love watching you eat your food. 😂 You look so cute when you're eating and enjoying your food.

I really love the person you are. I love how motivated you are and how you keep pushing yourself to do well in life. And somehow you make me want to do better too.

But today I don't want this to be about me. I want it to be about you.

You are genuinely such a beautiful person, inside and outside. I hope you never stop smiling, laughing, dreaming and being the amazing Yashi that you are.

You mean the world to me. ❤️

Happy birthday, Yashi. 🥹🎂

Keep being you. Because I love you exactly like that. ❤️

Happy birthday, my favourite person.
  `.trim();

  function paragraphsToHtml(text) {
    return text
      .trim()
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map(
        (paragraph) =>
          `<p>${paragraph
            .trim()
            .replace(/\n/g, "<br>")}</p>`
      )
      .join("\n");
  }

  function htmlToEditorText(html) {
    const box = document.createElement("div");

    box.innerHTML = html || "";

    return Array.from(box.querySelectorAll("p"))
      .map((paragraph) => paragraph.innerText.trim())
      .filter(Boolean)
      .join("\n\n");
  }

  // --------------------------------------------------
  // LOAD LETTER + FINAL NOTE
  // --------------------------------------------------

  async function loadV6Text() {
    const letterEditor = q("#letterEditor");
    const finalTitleEditor = q("#finalTitleEditor");
    const finalCaptionEditor = q("#finalCaptionEditor");

    if (!letterEditor) return;

    try {
      const result = await supabaseClient
        .from("site_content")
        .select("key,value");

      if (result.error) {
        throw result.error;
      }

      const map = Object.fromEntries(
        (result.data || []).map((row) => [
          row.key,
          row.value
        ])
      );

      letterEditor.value =
        htmlToEditorText(map.letter_html) ||
        V6_DEFAULT_LETTER;

      if (finalTitleEditor) {
        finalTitleEditor.value =
          map.final_note_title ||
          "Hope this little website makes you smile. ❤️";
      }

      if (finalCaptionEditor) {
        finalCaptionEditor.value =
          map.final_note_caption ||
          "made with way too much love & a little bit of chaos :)";
      }

    } catch (error) {
      console.warn("Could not load saved text:", error);

      letterEditor.value = V6_DEFAULT_LETTER;

      if (finalTitleEditor) {
        finalTitleEditor.value =
          "Hope this little website makes you smile. ❤️";
      }

      if (finalCaptionEditor) {
        finalCaptionEditor.value =
          "made with way too much love & a little bit of chaos :)";
      }
    }
  }

  // --------------------------------------------------
  // SAVE LETTER + FINAL NOTE
  // --------------------------------------------------

  async function saveV6Text() {
    const saveStatus = q("#textSaveStatus");

    if (saveStatus) {
      saveStatus.textContent = "Saving…";
    }

    try {
      const rows = [
        {
          key: "letter_html",
          value: paragraphsToHtml(
            q("#letterEditor").value
          )
        },
        {
          key: "final_note_title",
          value: q("#finalTitleEditor").value
        },
        {
          key: "final_note_caption",
          value: q("#finalCaptionEditor").value
        }
      ];

      const result = await supabaseClient
        .from("site_content")
        .upsert(rows, {
          onConflict: "key"
        });

      if (result.error) {
        throw result.error;
      }

      if (saveStatus) {
        saveStatus.textContent = "Saved! ❤️";
      }

    } catch (error) {
      console.error("SAVE ERROR:", error);

      if (saveStatus) {
        saveStatus.textContent =
          "Save failed: " +
          (error.message || "Unknown error");
      }
    }
  }

  const saveTextButton = q("#saveTextBtn");

  if (saveTextButton) {
    saveTextButton.addEventListener(
      "click",
      saveV6Text
    );
  }

  // --------------------------------------------------
  // CHECK EXISTING LOGIN SESSION
  // --------------------------------------------------

  (async () => {
    try {
      const result =
        await supabaseClient.auth.getSession();

      if (result.error) {
        console.error(result.error);
        return;
      }

      if (result.data.session) {
        q("#loginCard").classList.add("hidden");
        q("#panel").classList.remove("hidden");

        await refresh();
        await loadV6Text();
      }

    } catch (error) {
      console.error(
        "Session check failed:",
        error
      );
    }
  })();

})();
