const supabase=window.supabase.createClient("https://sefuulovdserechlxncb.supabase.co","sb_publishable_o8YYHkc9w4NzqBvJv8FjkQ_8FXaKGfm"),bucket="birthday-media",q=s=>document.querySelector(s);let media=[];
const url=p=>supabase.storage.from(bucket).getPublicUrl(p).data.publicUrl;const status=t=>q("#status").textContent=t;
async function refresh(){const r=await supabase.from("birthday_media").select("*").order("display_order").order("created_at");if(r.error)return status(r.error.message);media=r.data||[];const photos=media.filter(x=>x.type==="photo"),c=media.find(x=>x.type==="collage"),m=media.find(x=>x.type==="music");q("#photoList").innerHTML=photos.map(p=>`<div><img src="${url(p.file_path)}"><button class="remove" data-id="${p.id}" data-path="${p.file_path}">×</button></div>`).join("")||"<p class='muted'>No photos yet.</p>";q("#collagePreview").innerHTML=c?`<img src="${url(c.file_path)}">`:"<p class='muted'>No collage yet.</p>";q("#musicPreview").innerHTML=m?`<audio controls src="${url(m.file_path)}"></audio>`:"<p class='muted'>No music yet.</p>"}
async function upload(file,type){const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=type+"/"+Date.now()+"-"+crypto.randomUUID()+"-"+safe;let r=await supabase.storage.from(bucket).upload(path,file,{contentType:file.type});if(r.error)throw r.error;r=await supabase.from("birthday_media").insert({type,file_path:path,file_name:file.name,display_order:Date.now()});if(r.error){await supabase.storage.from(bucket).remove([path]);throw r.error}}
async function removeItem(id,path){let r=await supabase.from("birthday_media").delete().eq("id",id);if(r.error)throw r.error;await supabase.storage.from(bucket).remove([path])}
q("#loginForm").onsubmit=async e=>{e.preventDefault();q("#loginMsg").textContent="Signing in...";const r=await supabase.auth.signInWithPassword({email:q("#email").value,password:q("#password").value});if(r.error)q("#loginMsg").textContent=r.error.message;else{q("#loginCard").classList.add("hidden");q("#panel").classList.remove("hidden");refresh()}};
q("#logout").onclick=async()=>{await supabase.auth.signOut();location.reload()};
q("#uploadPhotos").onclick=async()=>{const fs=[...q("#photoInput").files];if(!fs.length)return status("Choose photos first.");try{status("Uploading...");for(const f of fs)await upload(f,"photo");q("#photoInput").value="";status("Photos uploaded ❤️");refresh()}catch(e){status(e.message)}};
q("#uploadCollage").onclick=async()=>{const f=q("#collageInput").files[0];if(!f)return status("Choose a collage first.");try{const old=media.find(x=>x.type==="collage");if(old)await removeItem(old.id,old.file_path);await upload(f,"collage");q("#collageInput").value="";status("Collage updated ❤️");refresh()}catch(e){status(e.message)}};
q("#uploadMusic").onclick=async()=>{const f=q("#musicInput").files[0];if(!f)return status("Choose audio first.");try{const old=media.find(x=>x.type==="music");if(old)await removeItem(old.id,old.file_path);await upload(f,"music");q("#musicInput").value="";status("Music updated ❤️");refresh()}catch(e){status(e.message)}};
q("#photoList").onclick=async e=>{const b=e.target.closest(".remove");if(!b)return;if(!confirm("Remove this photo?"))return;try{await removeItem(b.dataset.id,b.dataset.path);status("Photo removed.");refresh()}catch(x){status(x.message)}};
(async()=>{const r=await supabase.auth.getSession();if(r.data.session){q("#loginCard").classList.add("hidden");q("#panel").classList.remove("hidden");refresh()}})();
const V6_DEFAULT_LETTER = `<p>Happy birthdayyy to my favourite human. 🥹❤️</p>
<p>I honestly don't know where to start because there is just so much I want to say about you.</p>
<p>From the day you came into my life, somehow you became my favourite person. It just... happened.</p>
<p>I love your smile. Like seriously, your smile is the best. And when you laugh, you look sooo cute. 😂</p>
<p>And your big eyes... they are so dreamy. ❤️</p>
<p>And I love watching you eat your food. 😂 You look so cute when you're eating and enjoying your food.</p>
<p>I really love the person you are. I love how motivated you are and how you keep pushing yourself to do well in life. And somehow you make me want to do better too.</p>
<p>But today I don't want this to be about me. I want it to be about <strong>you</strong>.</p>
<p>You are genuinely such a beautiful person, inside and outside. I hope you never stop smiling, laughing, dreaming and being the amazing Yashi that you are.</p>
<p>You mean the world to me. ❤️</p>
<p>Happy birthday, Yashi. 🥹🎂</p>
<p>Keep being you. Because I love you exactly like that. ❤️</p>
<p><strong>Happy birthday, my favourite person.</strong></p>`;

function v6Client() {
  const url = typeof SUPABASE_URL !== "undefined" ? SUPABASE_URL : "https://sefuulovdserechlxncb.supabase.co";
  const key = typeof SUPABASE_KEY !== "undefined" ? SUPABASE_KEY : "sb_publishable_o8YYHkc9w4NzqBvJv8FjkQ_8FXaKGfm";
  return window.supabase.createClient(url, key);
}
function paragraphsToHtml(text) {
  return text.trim().split(/\n\s*\n/).filter(Boolean).map(p => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`).join("\n");
}
function htmlToEditorText(html) {
  const box = document.createElement("div"); box.innerHTML = html || "";
  return Array.from(box.querySelectorAll("p")).map(p => p.innerText.trim()).filter(Boolean).join("\n\n");
}
async function loadV6Text() {
  try {
    const client = v6Client();
    const {data, error} = await client.from("site_content").select("key,value");
    if (error) throw error;
    const map = Object.fromEntries((data || []).map(r => [r.key, r.value]));
    document.getElementById("letterEditor").value = htmlToEditorText(map.letter_html) || htmlToEditorText(V6_DEFAULT_LETTER);
    document.getElementById("finalTitleEditor").value = map.final_note_title || "Hope this little website<br><span>makes you smile. ❤️</span>";
    document.getElementById("finalCaptionEditor").value = map.final_note_caption || "made with way too much love & a little bit of chaos :)";
  } catch(e) {
    console.warn(e);
    document.getElementById("letterEditor").value = htmlToEditorText(V6_DEFAULT_LETTER);
    document.getElementById("finalTitleEditor").value = "Hope this little website<br><span>makes you smile. ❤️</span>";
    document.getElementById("finalCaptionEditor").value = "made with way too much love & a little bit of chaos :)";
  }
}
async function saveV6Text() {
  const status = document.getElementById("textSaveStatus");
  status.textContent = "Saving…";
  try {
    const client = v6Client();
    const rows = [
      {key:"letter_html", value:paragraphsToHtml(document.getElementById("letterEditor").value)},
      {key:"final_note_title", value:document.getElementById("finalTitleEditor").value},
      {key:"final_note_caption", value:document.getElementById("finalCaptionEditor").value}
    ];
    const {error} = await client.from("site_content").upsert(rows, {onConflict:"key"});
    if (error) throw error;
    status.textContent = "Saved! ❤️";
  } catch(e) {
    console.error(e);
    status.textContent = "Could not save. Run v6_text_setup.sql first.";
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("saveTextBtn");
  if (btn) {
    loadV6Text();
    btn.addEventListener("click", saveV6Text);
  }
});
