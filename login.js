(() => {
  // =========================
  // ✅ CONFIG (single source)
  // =========================
  const SUPABASE_URL = "https://qagktukzxtwbjrdgiben.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ2t0dWt6eHR3YmpyZGdpYmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDA0NTQsImV4cCI6MjA4MzQxNjQ1NH0.cbhSWHGlmhmIt-NmUVBUtAhPpNPDKk4Bz-Gy1TbPzHk";

  // ✅ Hardcode your live domain redirects (prevents null/file origins)
  const RESET_REDIRECT = "https://qfsnesaragesara.org/reset.html";
  const SIGNUP_REDIRECT = "https://qfsnesaragesara.org/login.html";

  const $ = (id) => document.getElementById(id);

  const dbg = $("dbg");
  const msgEl = $("msg");

  const loginBtn = $("loginBtn");
  const signupBtn = $("signupBtn");
  const forgotBtn = $("forgotBtn");
  const resendBtn = $("resendBtn");

  const emailEl = $("email");
  const passEl = $("password");

  const pwToggle = $("pwToggle");
  const eyeIcon = $("eyeIcon");

  const stamp = () => new Date().toLocaleTimeString();

  function setDbg(t){
    if (dbg) dbg.textContent = "dbg: " + t;
  }

  function showMsg(text, type=""){
    if(!msgEl) return alert(text);
    msgEl.className = "msg show " + type;
    msgEl.textContent = text;
  }

  function setBusyAll(b){
    if (loginBtn) loginBtn.disabled = b;
    if (signupBtn) signupBtn.disabled = b;
    if (forgotBtn) forgotBtn.disabled = b;
    if (resendBtn) resendBtn.disabled = b;
  }

  // =========================
  // ✅ ONE Supabase client
  // =========================
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    setDbg("supabase-js not loaded ❌");
    showMsg("❌ Supabase library not loaded.", "error");
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  setDbg("ready ✅ " + stamp());

  // =========================
  // Password visibility toggle
  // =========================
  if (pwToggle && passEl) {
    pwToggle.addEventListener("click", () => {
      const isPw = passEl.type === "password";
      passEl.type = isPw ? "text" : "password";

      // Optional small visual cue: slash the eye by changing icon paths
      // (kept minimal: we just change opacity slightly)
      if (eyeIcon) eyeIcon.style.opacity = isPw ? "0.75" : "1";
    });
  }

  // =========================
  // Single-fire guards
  // =========================
  let busy = false;
  function guard() {
    if (busy) return false;
    busy = true;
    setBusyAll(true);
    return true;
  }
  function unguard(delayMs = 400) {
    setTimeout(() => {
      busy = false;
      setBusyAll(false);
    }, delayMs);
  }

  // =========================
  // Actions (ONE handler each)
  // =========================
  async function doLogin(){
    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";
    if (!email || !password) return showMsg("Please enter email and password.", "error");

    showMsg("Signing in…", "");
    setDbg("login… " + stamp());

    try{
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return showMsg("Login failed: " + error.message, "error");

      // Save for portal fallback usage
      localStorage.setItem("qfsEmail", email);
      localStorage.setItem("memberEmail", email);

      showMsg("Login successful ✅ Redirecting…", "ok");
      setTimeout(() => (window.location.href = "portal.html"), 500);
    } catch (e) {
      showMsg("Login failed.", "error");
    }
  }

  async function doSignup(){
    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";
    if (!email || !password) return showMsg("Please enter email and password.", "error");

    showMsg("Creating account…", "");
    setDbg("signup… " + stamp());

    try{
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: SIGNUP_REDIRECT }
      });

      if (error) return showMsg("Signup failed: " + error.message, "error");

      localStorage.setItem("qfsEmail", email);
      localStorage.setItem("memberEmail", email);

      showMsg("Account created ✅ Check your email to confirm.", "ok");
    } catch (e) {
      showMsg("Signup failed.", "error");
    }
  }

  async function doForgotPassword(){
    const email = (emailEl?.value || "").trim();
    if (!email) return showMsg("Enter your email first.", "error");

    showMsg("Sending password reset email…", "");
    setDbg("forgot… " + stamp());

    try{
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: RESET_REDIRECT
      });

      if (error) return showMsg("Reset failed: " + error.message, "error");

      showMsg("Password reset email sent ✅ Check inbox/spam.", "ok");
    } catch (e) {
      showMsg("Reset failed.", "error");
    }
  }

  async function doResendVerification(){
    const email = (emailEl?.value || "").trim();
    if (!email) return showMsg("Enter your email first.", "error");

    showMsg("Resending verification email…", "");
    setDbg("resend… " + stamp());

    try{
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) return showMsg("Resend failed: " + error.message, "error");

      showMsg("Verification email resent ✅ Check inbox/spam.", "ok");
    } catch (e) {
      showMsg("Resend failed.", "error");
    }
  }

  // =========================
  // Wire buttons (ONCE)
  // =========================
  if (!loginBtn || !signupBtn || !forgotBtn || !resendBtn) {
    setDbg("missing buttons ❌");
    showMsg("Buttons not found in HTML. Check ids.", "error");
    return;
  }

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!guard()) return;
    try { await doLogin(); } finally { unguard(); }
  });

  signupBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!guard()) return;
    try { await doSignup(); } finally { unguard(); }
  });

  forgotBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!guard()) return;
    try { await doForgotPassword(); } finally { unguard(1200); } // longer guard prevents double emails
  });

  resendBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!guard()) return;
    try { await doResendVerification(); } finally { unguard(1200); }
  });

  // Helpful: if redirected back with a success flag
  const url = new URL(window.location.href);
  if (url.searchParams.get("msg") === "reset_ok") {
    showMsg("✅ Password updated. You can log in now.", "ok");
  } else {
    // Only show a subtle boot message once
    showMsg("Auth ready ✅", "");
  }

})();
