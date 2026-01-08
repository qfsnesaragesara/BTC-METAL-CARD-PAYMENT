(() => {
  const SUPABASE_URL = "https://qagktukzxtwbjrdgiben.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ2t0dWt6eHR3YmpyZGdpYmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDA0NTQsImV4cCI6MjA4MzQxNjQ1NH0.cbhSWHGlmhmIt-NmUVBUtAhPpNPDKk4Bz-Gy1TbPzHk";

  const msgEl = document.getElementById("msg");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  function showMsg(text, type = "") {
    if (!msgEl) return alert(text);
    msgEl.className = "msg show " + type;
    msgEl.textContent = text;
  }

  function setBusy(b) {
    if (loginBtn) loginBtn.disabled = b;
    if (signupBtn) signupBtn.disabled = b;
  }

  // Proof that this JS file loaded (so we know CSP is OK for external scripts)
  showMsg("JS loaded ✅", "");

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    showMsg("❌ Supabase library not found.\nMake sure /supabase.min.js exists on your site.", "error");
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  showMsg("Auth ready ✅", "");

  async function doLogin() {
    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";

    if (!email || !password) return showMsg("Please enter email and password.", "error");

    setBusy(true);
    showMsg("Signing in…", "");

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return showMsg("Login failed: " + error.message, "error");

      showMsg("Login successful ✅ Redirecting…", "ok");
      setTimeout(() => (window.location.href = "portal.html"), 700);
    } catch (e) {
      showMsg("Login failed: " + (e?.message || "Unknown error"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function doSignup() {
    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";

    if (!email || !password) return showMsg("Please enter email and password.", "error");

    setBusy(true);
    showMsg("Creating account…", "");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/login.html" }
      });

      if (error) return showMsg("Signup failed: " + error.message, "error");

      showMsg("Account created ✅ Check your email to confirm, then login.", "ok");
    } catch (e) {
      showMsg("Signup failed: " + (e?.message || "Unknown error"), "error");
    } finally {
      setBusy(false);
    }
  }

  loginBtn?.addEventListener("click", (e) => { e.preventDefault(); doLogin(); });
  signupBtn?.addEventListener("click", (e) => { e.preventDefault(); doSignup(); });
})();
