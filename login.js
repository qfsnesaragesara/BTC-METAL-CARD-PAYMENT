(() => {
  // =========================
  // ✅ ONE Supabase client
  // =========================
  const SUPABASE_URL = "https://qagktukzxtwbjrdgiben.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ2t0dWt6eHR3YmpyZGdpYmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDA0NTQsImV4cCI6MjA4MzQxNjQ1NH0.cbhSWHGlmhmIt-NmUVBUtAhPpNPDKk4Bz-Gy1TbPzHk";

  const dbg = document.getElementById("dbg");
  const msgEl = document.getElementById("msg");

  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const forgotBtn = document.getElementById("forgotBtn");
  const resendBtn = document.getElementById("resendBtn");

  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  const stamp = () => new Date().toLocaleTimeString();

  function setDbg(t) {
    if (dbg) dbg.textContent = "dbg: " + t;
  }

  function showMsg(text, type = "") {
    if (!msgEl) return alert(text);
    msgEl.className = "msg show " + type;
    msgEl.textContent = text;
  }

  function setBusy(b) {
    if (loginBtn) loginBtn.disabled = b;
    if (signupBtn) signupBtn.disabled = b;
    if (forgotBtn) forgotBtn.disabled = b;
    if (resendBtn) resendBtn.disabled = b;
  }

  // Basic guard
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    setDbg("supabase missing ❌");
    showMsg("❌ Supabase not loaded. Check the supabase-js script tag.", "error");
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  setDbg("login.js loaded ✅ " + stamp());

  // =========================
  // Routing helper
  // =========================
  function computePortalRedirect(user) {
    const md = user?.user_metadata || {};

    // 1) preferred: explicit redirect saved at registration
    if (typeof md.portal_redirect === "string" && md.portal_redirect.trim()) {
      return md.portal_redirect.trim();
    }

    // 2) fallback: tier check
    const tier = String(md.tier || "").toUpperCase();
    if (tier === "GOLD") return "portal-gold.html";

    // default
    return "portal.html";
  }

  // =========================
  // Actions
  // =========================
  async function doLogin() {
    const email = (emailEl?.value || "").trim().toLowerCase();
    const password = passEl?.value || "";
    if (!email || !password) return showMsg("Please enter email and password.", "error");

    setBusy(true);
    showMsg("Signing in…", "");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return showMsg("Login failed: " + error.message, "error");

      const user = data?.user;
      const target = computePortalRedirect(user);

      showMsg("Login successful ✅ Redirecting…", "ok");
      setDbg("login ok → " + target + " ✅ " + stamp());

      setTimeout(() => (window.location.href = target), 500);
    } catch (e) {
      showMsg("Login failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function doSignup() {
    const email = (emailEl?.value || "").trim().toLowerCase();
    const password = passEl?.value || "";
    if (!email || !password) return showMsg("Please enter email and password.", "error");
    if (password.length < 6) return showMsg("Password must be at least 6 characters.", "error");

    setBusy(true);
    showMsg("Creating account…", "");
    try {
      // NOTE: Registration page should create account + metadata.
      // This fallback signup is still allowed, but will route to portal.html by default.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: location.origin + "/login.html" },
      });

      if (error) return showMsg("Signup failed: " + error.message, "error");

      showMsg("Account created ✅ Check your email to confirm.", "ok");
      setDbg("signup ok ✅ " + stamp());
    } catch (e) {
      showMsg("Signup failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function doForgotPassword() {
    const email = (emailEl?.value || "").trim().toLowerCase();
    if (!email) return showMsg("Enter your email first.", "error");

    setBusy(true);
    showMsg("Sending reset email…", "");
    try {
      // IMPORTANT: this must match your hosted reset page
      const redirectTo = "https://qfsnesaragesara.org/reset.html";

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return showMsg("Reset failed: " + error.message, "error");

      showMsg("Password reset email sent ✅ Check inbox/spam.", "ok");
      setDbg("reset sent ✅ " + stamp());
    } catch (e) {
      showMsg("Reset failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function doResendVerification() {
    const email = (emailEl?.value || "").trim().toLowerCase();
    if (!email) return showMsg("Enter your email first.", "error");

    setBusy(true);
    showMsg("Resending verification email…", "");
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) return showMsg("Resend failed: " + error.message, "error");

      showMsg("Verification email resent ✅ Check inbox/spam.", "ok");
      setDbg("resend ok ✅ " + stamp());
    } catch (e) {
      showMsg("Resend failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  // =========================
  // Wire buttons (ONE handler each)
  // =========================
  if (loginBtn) loginBtn.addEventListener("click", (e) => { e.preventDefault(); doLogin(); });
  if (signupBtn) signupBtn.addEventListener("click", (e) => { e.preventDefault(); doSignup(); });
  if (forgotBtn) forgotBtn.addEventListener("click", (e) => { e.preventDefault(); doForgotPassword(); });
  if (resendBtn) resendBtn.addEventListener("click", (e) => { e.preventDefault(); doResendVerification(); });

  // Enter key submits login
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const active = document.activeElement;
      if (active && (active.id === "email" || active.id === "password")) {
        e.preventDefault();
        doLogin();
      }
    }
  });

})();
