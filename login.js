(() => {
  const SUPABASE_URL = "https://qagktukzxtwbjrdgiben.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ2t0dWt6eHR3YmpyZGdpYmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDA0NTQsImV4cCI6MjA4MzQxNjQ1NH0.cbhSWHGlmhmIt-NmUVBUtAhPpNPDKk4Bz-Gy1TbPzHk";

  const dbg = document.getElementById("dbg");
  const msgEl = document.getElementById("msg");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  const stamp = () => new Date().toLocaleTimeString();

  function setDbg(t){
    if (dbg) dbg.textContent = "dbg: " + t;
  }
  function showMsg(text, type=""){
    if(!msgEl) return alert(text);
    msgEl.className = "msg show " + type;
    msgEl.textContent = text;
  }
  function setBusy(b){
    loginBtn.disabled = b;
    signupBtn.disabled = b;
  }

  setDbg("login.js loaded ✅ " + stamp());
  showMsg("JS loaded ✅", "");

  if (!loginBtn || !signupBtn) {
    setDbg("buttons not found ❌");
    showMsg("Buttons not found in HTML. Check ids loginBtn/signupBtn.", "error");
    return;
  }

  // Click proof (even before supabase)
  loginBtn.addEventListener("click", () => setDbg("LOGIN clicked ✅ " + stamp()));
  signupBtn.addEventListener("click", () => setDbg("SIGNUP clicked ✅ " + stamp()));

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    setDbg("supabase missing ❌");
    showMsg("❌ Supabase not loaded. Make sure /supabase.min.js exists.", "error");
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  setDbg("supabase ready ✅ " + stamp());
  showMsg("Auth ready ✅", "");

  async function doLogin(){
    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";
    if (!email || !password) return showMsg("Please enter email and password.", "error");

    setBusy(true);
    showMsg("Signing in…", "");
    try{
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return showMsg("Login failed: " + error.message, "error");

      showMsg("Login successful ✅ Redirecting…", "ok");
      setTimeout(()=>location.href="portal.html", 700);
    } finally {
      setBusy(false);
    }
  }

  async function doSignup(){
    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";
    if (!email || !password) return showMsg("Please enter email and password.", "error");

    setBusy(true);
    showMsg("Creating account…", "");
    try{
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: location.origin + "/login.html" }
      });

      if (error) return showMsg("Signup failed: " + error.message, "error");
      showMsg("Account created ✅ Check your email to confirm.", "ok");
    } finally {
      setBusy(false);
    }
  }

  // Real actions
  loginBtn.addEventListener("click", (e) => { e.preventDefault(); doLogin(); });
  signupBtn.addEventListener("click", (e) => { e.preventDefault(); doSignup(); });
})();
