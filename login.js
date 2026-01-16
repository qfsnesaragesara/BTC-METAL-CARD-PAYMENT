(() => {
  // =========================
  // CONFIG
  // =========================
  const SUPABASE_URL = "https://qagktukzxtwbjrdgiben.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ2t0dWt6eHR3YmpyZGdpYmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDA0NTQsImV4cCI6MjA4MzQxNjQ1NH0.cbhSWHGlmhmIt-NmUVBUtAhPpNPDKk4Bz-Gy1TbPzHk";

  const $ = (id) => document.getElementById(id);

  const dbg = $("dbg");
  const msgEl = $("msg");

  const emailEl = $("email");
  const passEl = $("password");

  const loginBtn = $("loginBtn");
  const signupBtn = $("signupBtn");
  const resendBtn = $("resendBtn");

  // OPTIONAL (only if your HTML has it)
  const forgotBtn = $("forgotBtn"); // <button id="forgotBtn">
  const togglePwBtn = $("togglePw"); // <button id="togglePw">

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
    if (resendBtn) resendBtn.disabled = b;
    if (forgotBtn) forgotBtn.disabled = b;
  }

  // =========================
  // Boot
  // =========================
  setDbg("login.js loaded ✅ " + stamp());

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    setDbg("supabase missing ❌");
    showMsg("❌ Supabase not loaded. Make sure /supabase.min.js exists.", "error");
    return;
  }

  // ✅ ONE client only
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // =========================
  // Helpers
  // =========================
  function normalizeTier(x) {
    return String(x || "").trim().toLowerCase();
  }

  async function getUserTierFromSubmissions(email) {
    // Reads latest submission (source of truth)
    // Table: payment_submissions
    // Columns used: email, card_type, created_at
    try {
      const { data, error } = await supabase
        .from("payment_submissions")
        .select("card_type, created_at")
        .ilike("email", email)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) return null;
      const row = data && data[0] ? data[0] : null;
      return normalizeTier(row?.card_type);
    } catch {
      return null;
    }
  }

  async function routeUser(email) {
    // GOLD -> portal-gold.html
    // SILVER/BLACK/anything -> portal.html
    const tier = await getUserTierFromSubmissions(email);

    if (tier === "gold") {
      window.location.href = "portal-gold.html";
      return;
    }
    window.location.href = "portal.html";
  }

  // =========================
  // Auth Actions
  // =========================
  async function doLogin() {
    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";
    if (!email || !password) return showMsg("Please enter email and password.", "error");

    setBusy(true);
    showMsg("Signing in…", "");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return showMsg("Login failed: " + error.message, "error");

      // store email for portal pages
      localStorage.setItem("qfsEmail", email);
      localStorage.setItem("memberEmail", email);

      // If email not verified, block access and help user
      const user = data?.user;
      const verifiedAt = user?.email_confirmed_at || user?.confirmed_at || null;
      if (!verifiedAt) {
        showMsg("⚠️ Please verify your email first. Use ‘Resend Verification Email’.", "error");
        await supabase.auth.signOut();
        return;
      }

      showMsg("Login successful ✅ Redirecting…", "ok");
      setTimeout(() => routeUser(email), 450);
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
      // IMPORTANT: emailRedirectTo should point back to your site
      const redirectTo = window.location.origin + "/login.html";

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) return showMsg("Signup failed: " + error.message, "error");
      showMsg("Account created ✅ Check your email to confirm.", "ok");
    } finally {
      setBusy(false);
    }
  }

  async function doResendVerification() {
    const email = (emailEl?.value || "").trim();
    if (!email) return showMsg("Enter your email first.", "error");

    setBusy(true);
    showMsg("Resending verification email…", "");
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) return showMsg("Resend failed: " + error.message, "error");
      showMsg("Verification email resent ✅ Check inbox/spam.", "ok");
    } finally {
      setBusy(false);
    }
  }

  async function doForgotPassword() {
    const email = (emailEl?.value || "").trim();
    if (!email) return showMsg("Enter your email first.", "error");

    setBusy(true);
    showMsg("Sending reset email…", "");
    try {
      // This must match the page you host
      const redirectTo = window.location.origin + "/reset.html";

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return showMsg("Reset failed: " + error.message, "error");

      showMsg("Password reset email sent ✅ Check inbox/spam.", "ok");
    } finally {
      setBusy(false);
    }
  }

  // =========================
  // Wire buttons (ONE handler each)
  // =========================
  if (loginBtn) loginBtn.addEventListener("click", (e) => { e.preventDefault(); setDbg("LOGIN clicked ✅ " + stamp()); doLogin(); });
  if (signupBtn) signupBtn.addEventListener("click", (e) => { e.preventDefault(); setDbg("SIGNUP clicked ✅ " + stamp()); doSignup(); });
  if (resendBtn) resendBtn.addEventListener("click", (e) => { e.preventDefault(); setDbg("RESEND clicked ✅ " + stamp()); doResendVerification(); });

  if (forgotBtn) {
    forgotBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setDbg("FORGOT clicked ✅ " + stamp());
      doForgotPassword();
    });
  }

  // Optional: password eye toggle if you have #togglePw
  if (togglePwBtn && passEl) {
    togglePwBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const now = passEl.type === "password" ? "text" : "password";
      passEl.type = now;
      togglePwBtn.setAttribute("aria-pressed", now === "text" ? "true" : "false");
    });
  }

  setDbg("supabase ready ✅ " + stamp());
})();
